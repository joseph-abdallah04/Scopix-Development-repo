import numpy as np
import pandas as pd
import physio
from scipy.signal import butter, filtfilt
from scipy.stats import skew
from physio.parameters import get_respiration_parameters


class Resp_seg:

    def __init__(self, flow_column="Flow_Filtered", fs=200):

        self.flow_column = flow_column
        self.fs = fs
        
    def find_nearest_zero_crossing(self, signal: np.ndarray, index: int, window: int = 20) -> int:
        start = max(index - window, 1)
        end = min(index + window, len(signal) - 1)

        for i in range(start, end):
            if signal[i - 1] * signal[i] < 0:
                return i if abs(signal[i]) < abs(signal[i - 1]) else i - 1
        return index

    def align_cycle_indices_to_zero_crossing(self, resp: np.ndarray, cycles_df: pd.DataFrame, window: int = 10) -> pd.DataFrame:
        aligned = cycles_df.copy()
        for col in ["inspi_index", "expi_index", "next_inspi_index"]:
            aligned[col] = aligned[col].apply(
                lambda idx: self.find_nearest_zero_crossing(resp, int(idx), window) if not pd.isnull(idx) else np.nan
            )
        return aligned



    def seg_breaths(self, df: pd.DataFrame) -> pd.DataFrame:
    
        try:
            raw_resp = df[self.flow_column].fillna(0).values
                       
        except Exception as e:
            print(f"[ERROR] Missing column '{self.flow_column}':{e}")
            return pd.DataFrame()

        try:
            resp = -raw_resp
        
            """
            resp = physio.preprocess(
                raw_resp,
                self.fs,
                band=6.0,
                btype="lowpass",
                ftype="bessel",
                order=5,
                normalize=False,
            )
            """
            
            resp = physio.smooth_signal(
                resp,
                self.fs,
                win_shape="gaussian",
                sigma_ms=90.0,
            )

        except Exception as e:
            print(f"[ERROR] Smoothing signal processing failed: {e}")
            return pd.DataFrame()

        baseline = 0.0
        
        try:
            cycles = physio.detect_respiration_cycles(
                resp,
                self.fs,
                baseline_mode="manual",
                baseline=baseline,
                inspiration_adjust_on_derivative=True
            )

        except Exception as e:
            print(f"[ERROR] Respiratory cycle detection failed: {e}")
            return pd.DataFrame()

        try:
            resp_cycles = physio.compute_respiration_cycle_features(
                resp,
                self.fs,
                cycles,
                baseline=baseline
            )

        except Exception as e:
            print(f"[ERROR] Respiratory cycle feature calculation failed: {e}")
            return pd.DataFrame() 

        try:
            resp_cycles = physio.clean_respiration_cycles(
                resp,
                self.fs,
                resp_cycles,
                baseline,
                low_limit_log_ratio=5
            )
            
            
            
            resp_cycles = self.align_cycle_indices_to_zero_crossing(raw_resp, resp_cycles)
            
            
            
            
        except Exception as e:
            print(f"[ERROR] Breathing cycle clearing failure: {e}")
            return pd.DataFrame()
    
        try:
            breaths = []
            for _, row in resp_cycles.iterrows():
                if any(pd.isnull([row["inspi_index"], row["expi_index"], row["next_inspi_index"]])):
                    print(f"[WARN] Skip row: NaN in index field: {row}")
                    continue
                if int(row["next_inspi_index"]) >= len(resp):
                    print(f"[WARN] Skip row: next_inspi_index {row['next_inspi_index']} >= resp len {len(resp)}")
                    continue

            
                breaths.append({
                    "inspiration_start": int(row["inspi_index"]),
                    "inspiration_end":   int(row["expi_index"]),
                    "expiration_start":  int(row["expi_index"] + 1),
                    "expiration_end":    int(row["next_inspi_index"]),

                    "inspiration_start_time": float(row["inspi_time"]),
                    "inspiration_end_time":   float(row["expi_time"]),
                    "expiration_start_time":  float(row["expi_time"]),
                    "expiration_end_time":    float(row["next_inspi_time"]),

                    "inspiration_duration": float(row["inspi_duration"]),
                    "expiration_duration":  float(row["expi_duration"]),
                    "total_duration":       float(row["cycle_duration"]),

                    "inspiration_volume": float(row["inspi_volume"]),
                    "expiration_volume":  float(row["expi_volume"]),
                    "total_volume":       float(row["total_volume"]),

                    "inspiration_amplitude": float(row["inspi_amplitude"]),
                    "expiration_amplitude":  float(row["expi_amplitude"]),
                    "total_amplitude":       float(row["total_amplitude"]),
                })

            for i in range(len(breaths) - 1):
                breaths[i + 1]["inspiration_start"] = breaths[i]["expiration_end"] + 1
                breaths[i + 1]["inspiration_start_time"] = breaths[i]["expiration_end_time"] + 1 / self.fs
            return pd.DataFrame(breaths)

        except Exception as e:
            print(f"[ERROR] Failed to generate the breathing calculation table: {e}")
            return pd.DataFrame()
