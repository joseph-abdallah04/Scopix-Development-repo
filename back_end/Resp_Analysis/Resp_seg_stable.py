import numpy as np
import pandas as pd
import physio
from scipy.signal import butter, filtfilt
from scipy.stats import skew
from physio.parameters import get_respiration_parameters


class FlowDirectionInferer:
    def __init__(self,
                 fs: int = 200,
                 score_threshold: int = 2,
                 rms_min_threshold: float = 0.02,
                 enable_debug: bool = False):
        self.fs = fs
        self.score_threshold = score_threshold
        self.rms_min_threshold = rms_min_threshold
        self.enable_debug = enable_debug

    def _lowpass_filter(self, signal: np.ndarray) -> np.ndarray:
        b, a = butter(N=2, Wn=1.0 / (self.fs / 2), btype='low')
        return filtfilt(b, a, signal)

    def _mad_clip(self, signal: np.ndarray, k: float = 6.0) -> np.ndarray:
        median = np.median(signal)
        mad = np.median(np.abs(signal - median))
        lower = median - k * mad
        upper = median + k * mad
        return np.clip(signal, lower, upper)

    def _rms(self, signal: np.ndarray) -> float:
        return np.sqrt(np.mean(signal ** 2))

    def infer(self, signal: np.ndarray) -> dict:
        signal = np.nan_to_num(signal - np.nanmean(signal))
        result = {"direction": None, "score": 0, "confidence": 0.0, "details": {}}

        # 1. 去噪 + 滤波
        clipped = self._mad_clip(signal)
        filt = self._lowpass_filter(clipped)

        if self._rms(filt) < self.rms_min_threshold:
            result.update({
                "direction": "undecided",
                "confidence": 0.0,
                "details": {"rms": self._rms(filt)}
            })
            return result

        score = 0
        total_votes = 0
        details = {}

        # 投票 1：能量对比
        pos_energy = np.sum(filt[filt > 0] ** 2)
        neg_energy = np.sum(filt[filt < 0] ** 2)
        vote_energy = int(pos_energy > neg_energy)
        score += vote_energy
        total_votes += 1
        details["energy_vote"] = vote_energy

        # 投票 2：分位差异（双尺度）
        p95, p5 = np.percentile(filt, 95), np.percentile(filt, 5)
        p90, p10 = np.percentile(filt, 90), np.percentile(filt, 10)
        vote_percentile = int((p95 + p90) > abs(p5 + p10))
        score += vote_percentile
        total_votes += 1
        details["percentile_vote"] = vote_percentile

        # 投票 3：偏度
        s = skew(filt)
        vote_skew = int(s > 0)
        score += vote_skew
        total_votes += 1
        details["skewness_vote"] = vote_skew
        details["skewness"] = s

        # 投票 4：呼吸周期振幅对称性
        try:
            peaks, _ = find_peaks(filt, distance=self.fs * 0.8)
            troughs, _ = find_peaks(-filt, distance=self.fs * 0.8)
            if len(peaks) >= 2 and len(troughs) >= 2:
                avg_peak = np.mean(filt[peaks])
                avg_trough = np.mean(filt[troughs])
                vote_cycle = int(avg_peak > abs(avg_trough))
                score += vote_cycle
                total_votes += 1
                details["cycle_vote"] = vote_cycle
        except Exception:
            details["cycle_vote"] = "skipped"

        result["score"] = score
        result["confidence"] = round(score / total_votes, 3)
        result["direction"] = (
            "inspiration_positive" if score >= self.score_threshold else "inspiration_negative"
        )
        result["details"] = details

        if self.enable_debug:
            print("[FlowDirectionInferer] Decision Path:", result)

        return result


class Resp_seg:

    def __init__(self, flow_column="Flow_Filtered", fs=200):

        self.flow_column = flow_column
        self.fs = fs

    def seg_breaths(self, df: pd.DataFrame) -> pd.DataFrame:
    
        try:
            raw_resp = df[self.flow_column].fillna(0).values
            raw_resp = -raw_resp
            
            # 👇 使用方向判断器
            '''
            direction_inferer = FlowDirectionInferer(fs=self.fs)
            direction = direction_inferer.infer(raw_resp)

            if direction == "inspiration_negative":
                print("[INFO] Detected negative inspiration (Flow < 0), flipping signal")
                raw_resp = -raw_resp
            '''
            
        except Exception as e:
            print(f"[ERROR] Missing column '{self.flow_column}':{e}")
            return pd.DataFrame()

        try:
            resp = raw_resp
        
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
