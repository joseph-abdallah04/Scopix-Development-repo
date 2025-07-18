import numpy as np
import pandas as pd
from typing import Iterator
from joblib import Parallel, delayed

class ImpCalc:
    def __init__(self, freq: list[str]=["R5", "R19", "X5"]):
        self.freq = freq

    def _stats(self, arr: np.ndarray) ->tuple[float, float, float, float]:
        if arr.size == 0:
            return np.nan, np.nan, np.nan, np.nan
        return np.mean(arr), np.min(arr), np.max(arr), np.max(arr) - np.min(arr)

    def _get_slices(self, is_idx: int, ie_idx: int, es_idx: int, ee_idx: int) -> dict:
        return{
            "INSP": slice(is_idx, ie_idx + 1),
            "EXP": slice(es_idx, ee_idx + 1),
            "TOTAL": slice(is_idx,ee_idx + 1),
        }

    def _compute_imp_frq_metrics(
        self,
        freq: str,
        arr: np.ndarray,
        slices: dict[str, slice]
    ) -> dict[str, float]:
        result = {}
        for label in ["INSP", "EXP", "TOTAL"]:
            m, mi, ma, ran = self._stats(arr[slices[label]])
            result[f"{freq}_{label}"] = float(m)
            if label == "TOTAL":
                result[f"{freq}_MIN"] = float(mi)
                result[f"{freq}_MAX"] = float(ma)
                result[f"{freq}_MAX-MIN"] = float(ran)
        return result

    def _get_breath_indices(self, b, index_array):
        return (
            np.searchsorted(index_array, b.inspiration_start),
            np.searchsorted(index_array, b.inspiration_end),
            np.searchsorted(index_array, b.expiration_start),
            np.searchsorted(index_array, b.expiration_end),
        )

    def _calc_r5_19_metrics(self, slices, r5_19):
        m, mi, ma, ran = self._stats(r5_19[slices["TOTAL"]])
        m_insp = self._stats(r5_19[slices["INSP"]])[0]
        m_exp = self._stats(r5_19[slices["EXP"]])[0]

        return {
            "R5-19_TOTAL": float(m),
            "R5-19_MIN": float(mi),
            "R5-19_MAX": float(ma),
            "R5-19_MAX-MIN": float(ran),
            "R5-19_INSP": float(m_insp),
            "R5-19_EXP": float(m_exp),
        }

    def _calc_imp_freqs(self, slices, data_cache):
        result = {}
        for freq in self.freq:
            arr = data_cache[freq]
            result.update(self._compute_imp_frq_metrics(freq, arr, slices))
        return result

    def _calc_volume(self, volume, is_idx, ie_idx, es_idx, ee_idx):
        return {
            "INSP_Volume": float(volume[ie_idx] - volume[is_idx]),
            "EXP_Volume": float(volume[ee_idx] - volume[es_idx]),
        }

    def _process_breath(self, i, b, index_array, data_cache, r5_19, volume, indices):
        row = {"breath_index": i + 1}

        is_idx, ie_idx, es_idx, ee_idx = indices
        slices = self._get_slices(is_idx, ie_idx, es_idx, ee_idx)

        row.update(self._calc_r5_19_metrics(slices, r5_19))
        row.update(self._calc_imp_freqs(slices, data_cache))
        row.update(self._calc_volume(volume, is_idx, ie_idx, es_idx, ee_idx))

        return row

    def _iter_calc(self, df: pd.DataFrame, breaths: pd.DataFrame) -> Iterator[dict[str, float]]:
        try:
            index_array = df.index.to_numpy()
            exclude_cols = {"#", "Time"}
            data_cache = {col: df[col].to_numpy() for col in df.columns if col not in exclude_cols}
            r5 = data_cache["R5"]
            r19 = data_cache["R19"]
            volume = data_cache["Volume"]
            r5_19 = r5 - r19
        except KeyError as e:
            print(f"[ERROR] Missing required columns: {e}")
            return iter(())

        results = Parallel(n_jobs=-1)(
            delayed(self._safe_process_breath)(i, b, index_array, data_cache, r5_19, volume)
            for i, b in enumerate(breaths.itertuples(index=False))
        )
        return (r for r in results if r is not None)

    def _safe_process_breath(self, i, b, index_array, data_cache, r5_19, volume):
        try:
            indices = self._get_breath_indices(b, index_array)
            is_idx, ie_idx, es_idx, ee_idx = indices
            if not (is_idx <= ie_idx and es_idx <= ee_idx and ie_idx < es_idx):
                print(f"[WARN] Invalid index order for breath cycle {i + 1}, skipping")
                return None
            return self._process_breath(i, b, index_array, data_cache, r5_19, volume, indices)
        except Exception as e:
            print(f"[ERROR] Failed to process breath cycle {i + 1}: {e}")
            return None


    def calc(self, df: pd.DataFrame, breaths: pd.DataFrame) -> pd.DataFrame:


        return pd.DataFrame(self._iter_calc(df, breaths))
