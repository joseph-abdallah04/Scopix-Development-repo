import numpy as np
import pandas as pd
import physio
from typing import List, Dict
import chardet
import io


class BreathSegmenter:
    def __init__(self, flow_column="Flow_Filtered", fs=200):
        self.flow_column = flow_column
        self.fs = fs
        self.expected_cols = ["inspi_index", "expi_index", "next_inspi_index"]

    def _nearest_zero(self, signal: np.ndarray, idx: int, window=20) -> int:
        for i in range(max(idx - window, 1), min(idx + window, len(signal) - 1)):
            if signal[i - 1] * signal[i] < 0:
                return i if abs(signal[i]) < abs(signal[i - 1]) else i - 1
        return idx

    def segment(self, df: pd.DataFrame) -> pd.DataFrame:
        if self.flow_column not in df:
            print(f"[ERROR] Missing '{self.flow_column}'")
            return pd.DataFrame()

        raw = df[self.flow_column].fillna(0).values
        try:
            resp = physio.smooth_signal(-raw, self.fs, win_shape="gaussian", sigma_ms=90)
        except Exception as e:
            print(f"[ERROR] Smoothing failed: {e}")
            return pd.DataFrame()

        try:
            baseline = 0.0
            cycles = physio.detect_respiration_cycles(resp, self.fs, baseline_mode="manual", baseline=baseline)
            features = physio.compute_respiration_cycle_features(resp, self.fs, cycles, baseline=baseline)
            cleaned = physio.clean_respiration_cycles(resp, self.fs, features, baseline, low_limit_log_ratio=5)
        except Exception as e:
            print(f"[ERROR] Cycle analysis failed: {e}")
            return pd.DataFrame()

        for col in self.expected_cols:
            cleaned[col] = cleaned[col].apply(
                lambda idx: self._nearest_zero(raw, int(idx)) if pd.notnull(idx) else np.nan
            )

        return self._build_table(cleaned, resp)

    def _build_table(self, df: pd.DataFrame, resp: np.ndarray) -> pd.DataFrame:
        breaths: List[Dict] = []
        for _, row in df.iterrows():
            if any(pd.isnull(row[col]) for col in self.expected_cols):
                continue
            if int(row["next_inspi_index"]) >= len(resp):
                continue
            breaths.append({
                "inspiration_start":      int(row["inspi_index"]),
                "inspiration_end":        int(row["expi_index"]),
                "expiration_start":       int(row["expi_index"]) + 1,
                "expiration_end":         int(row["next_inspi_index"]),

                "inspiration_start_time": float(row["inspi_time"]),
                "inspiration_end_time":   float(row["expi_time"]),
                "expiration_start_time":  float(row["expi_time"]),
                "expiration_end_time":    float(row["next_inspi_time"]),

                "inspiration_duration":   float(row["inspi_duration"]),
                "expiration_duration":    float(row["expi_duration"]),
                "total_duration":         float(row["cycle_duration"]),

                "inspiration_volume":     float(row["inspi_volume"]),
                "expiration_volume":      float(row["expi_volume"]),
                "total_volume":           float(row["total_volume"]),

                "inspiration_amplitude":  float(row["inspi_amplitude"]),
                "expiration_amplitude":   float(row["expi_amplitude"]),
                "total_amplitude":        float(row["total_amplitude"]),
            })

        for i in range(len(breaths) - 1):
            breaths[i + 1]["inspiration_start"] = breaths[i]["expiration_end"] + 1
            breaths[i + 1]["inspiration_start_time"] = breaths[i]["expiration_end_time"] + 1 / self.fs

        return pd.DataFrame(breaths)

