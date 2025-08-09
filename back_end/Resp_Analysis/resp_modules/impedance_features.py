import numpy as np
import pandas as pd
from typing import List, Dict


class ImpedanceFeatureExtractor:
    def __init__(self, freq: List[str] = ["R5", "R19", "X5"], diffs: List[tuple] = [("R5", "R19")]):
        self.freq = freq
        self.diffs = diffs

    def calc(self, df: pd.DataFrame, breaths: pd.DataFrame) -> pd.DataFrame:
        index = np.asarray(df.index)
        data = {col: np.asarray(df[col]) for col in df.columns if col not in {"#", "Time"}}

        def stat_segments(signal: np.ndarray, start: np.ndarray, end: np.ndarray):
            mean = [np.mean(signal[s:e+1]) for s, e in zip(start, end)]
            minv = [np.min(signal[s:e+1]) for s, e in zip(start, end)]
            maxv = [np.max(signal[s:e+1]) for s, e in zip(start, end)]
            return np.array(mean), np.array(minv), np.array(maxv), np.array(maxv) - np.array(minv)

        start_i = np.searchsorted(index, breaths["inspiration_start"])
        end_i = np.searchsorted(index, breaths["inspiration_end"])
        start_e = np.searchsorted(index, breaths["expiration_start"])
        end_e = np.searchsorted(index, breaths["expiration_end"])

        N = len(breaths)
        result = {"breath_index": np.arange(1, N + 1)}

        for name, sig in [("R5-19", data["R5"] - data["R19"])] + [(f, data[f]) for f in self.freq]:
            # 计算 INSP
            insp_mean, _, _, _ = stat_segments(sig, start_i, end_i)
            exp_mean, _, _, _ = stat_segments(sig, start_e, end_e)
            total_mean, total_min, total_max, total_range = stat_segments(sig, start_i, end_e)

            result[f"{name}_INSP"] = insp_mean
            result[f"{name}_EXP"] = exp_mean
            result[f"{name}_TOTAL"] = total_mean
            result[f"{name}_MIN"] = total_min
            result[f"{name}_MAX"] = total_max
            result[f"{name}_MAX-MIN"] = total_range
            result[f"{name}_INSP-EXP"] = insp_mean - exp_mean

        # Volume 计算
        vol = data["Volume"]
        result["INSP_Volume"] = vol[end_i] - vol[start_i]
        result["EXP_Volume"] = vol[end_e] - vol[start_e]

        return pd.DataFrame(result)

