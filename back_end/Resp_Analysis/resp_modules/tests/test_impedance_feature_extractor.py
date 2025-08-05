import pytest
import numpy as np
import pandas as pd
from impedance_features import ImpedanceFeatureExtractor  # 替换为你的实际模块路径


# ---------- 工具函数 ----------

@pytest.fixture
def signal_df():
    """构造模拟信号 DataFrame"""
    t = np.linspace(0, 10, 1001)
    df = pd.DataFrame({
        "Time": t,
        "#": np.arange(len(t)),
        "R5": np.sin(t),
        "R19": np.sin(t) * 0.8,
        "X5": np.cos(t),
        "Volume": t * 0.5
    })
    return df


@pytest.fixture
def breaths_df():
    """构造模拟的分段信息"""
    return pd.DataFrame({
        "inspiration_start": [100, 400],
        "inspiration_end": [200, 500],
        "expiration_start": [201, 501],
        "expiration_end": [300, 600],
    })


# ---------- 功能性测试 ----------

def test_calc_basic(signal_df, breaths_df):
    extractor = ImpedanceFeatureExtractor()
    result = extractor.calc(signal_df, breaths_df)

    assert isinstance(result, pd.DataFrame)
    assert result.shape[0] == 2  # 两个呼吸周期
    assert set(result.columns).issuperset({
        "R5_INSP", "R5_EXP", "R5_TOTAL",
        "R5_MAX", "R5_MIN", "R5_MAX-MIN",
        "R5-19_INSP-EXP", "INSP_Volume", "EXP_Volume"
    })


def test_r5_19_computed_correctly(signal_df, breaths_df):
    extractor = ImpedanceFeatureExtractor()
    result = extractor.calc(signal_df, breaths_df)

    # 验证 R5-19_INSP == R5_INSP - R19_INSP
    r5 = result["R5_INSP"]
    r19 = result["R19_INSP"]
    r5_19 = result["R5-19_INSP"]
    np.testing.assert_allclose(r5 - r19, r5_19, rtol=1e-4)


def test_insp_exp_total_coverage(signal_df, breaths_df):
    extractor = ImpedanceFeatureExtractor()
    result = extractor.calc(signal_df, breaths_df)

    # TOTAL 范围覆盖 INSP + EXP
    total = result["R5_TOTAL"]
    insp = result["R5_INSP"]
    exp = result["R5_EXP"]
    assert np.all((total > np.minimum(insp, exp) - 1e-6) & (total < np.maximum(insp, exp) + 1e-6))


def test_volume_difference_consistent(signal_df, breaths_df):
    extractor = ImpedanceFeatureExtractor()
    result = extractor.calc(signal_df, breaths_df)

    vols = signal_df["Volume"].values
    index = np.asarray(signal_df.index)
    start_i = np.searchsorted(index, breaths_df["inspiration_start"])
    end_i = np.searchsorted(index, breaths_df["inspiration_end"])
    true_insp_vol = vols[end_i] - vols[start_i]

    np.testing.assert_array_almost_equal(true_insp_vol, result["INSP_Volume"])


# ---------- 边界/异常情况 ----------

def test_single_breath_segment():
    df = pd.DataFrame({
        "#": range(20),
        "Time": np.linspace(0, 1, 20),
        "R5": np.arange(20),
        "R19": np.arange(20) * 0.9,
        "X5": np.linspace(-1, 1, 20),
        "Volume": np.linspace(0, 1, 20)
    })
    breaths = pd.DataFrame({
        "inspiration_start": [2],
        "inspiration_end": [5],
        "expiration_start": [6],
        "expiration_end": [9],
    })

    result = ImpedanceFeatureExtractor().calc(df, breaths)
    assert result.shape[0] == 1


def test_missing_required_column(signal_df, breaths_df):
    bad_df = signal_df.drop(columns=["R5"])
    with pytest.raises(KeyError):
        ImpedanceFeatureExtractor().calc(bad_df, breaths_df)


def test_out_of_bounds_index(signal_df, breaths_df):
    # 呼吸段位置越界
    breaths = breaths_df.copy()
    breaths.loc[0, "expiration_end"] = 9999
    with pytest.raises(IndexError):
        ImpedanceFeatureExtractor().calc(signal_df, breaths)

