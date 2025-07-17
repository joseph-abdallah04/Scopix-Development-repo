import pytest
import pandas as pd
from pandas.testing import assert_frame_equal

from reshape_vis import reshape_for_visualization


def test_valid_input():
    df = pd.DataFrame([{
        "breath_index": 1,
        "INSP_Volume": 0.4,
        "EXP_Volume": 0.5,
        "inspiration_start": 10,
        "inspiration_end": 50,
        "expiration_start": 51,
        "expiration_end": 90,
        "R5-19_INSP": 0.1,
        "R5_INSP": 0.2,
        "R19_INSP": 0.3,
        "R5-19_EXP": 0.4,
        "R5_EXP": 0.5,
        "R19_EXP": 0.6,
        "R5-19_TOTAL": 0.7,
        "R5_TOTAL": 0.8,
        "R19_TOTAL": 0.9,
        "R5-19_MAX": 1.0,
        "R5_MAX": 1.1,
        "R19_MAX": 1.2,
        "R5-19_MIN": 1.3,
        "R5_MIN": 1.4,
        "R19_MIN": 1.5,
        "R5-19_MAX-MIN": 1.6,
        "R5_MAX-MIN": 1.7,
        "R19_MAX-MIN": 1.8,
    }])

    result = reshape_for_visualization(df)

    # 核心检查：segment 存在，数据不为空，且包含所有字段
    assert not result.empty
    assert set(["INSP", "EXP", "TOTAL", "MAX", "MIN", "MAX-MIN"]).issubset(set(result["segment"].dropna()))
    assert all(col in result.columns for col in [
        "breath_index", "segment", "INSP_Volume", "EXP_Volume",
        "R5-19", "R5", "R19", "inspiration_start", "inspiration_end",
        "expiration_start", "expiration_end"
    ])


def test_missing_required_columns():
    df = pd.DataFrame([{
        "INSP_Volume": 0.3,  # 缺少 breath_index 等
    }])
    result = reshape_for_visualization(df)
    assert isinstance(result, pd.DataFrame)
    assert result.empty


def test_partial_impedance_columns():
    df = pd.DataFrame([{
        "breath_index": 2,
        "INSP_Volume": 0.5,
        "EXP_Volume": 0.4,
        "inspiration_start": 100,
        "inspiration_end": 150,
        "expiration_start": 151,
        "expiration_end": 190,
        "R5_INSP": 0.2,  # 只给一部分阻抗数据
    }])
    result = reshape_for_visualization(df)
    assert not result.empty
    assert result["R5-19"].isnull().any()  # 没有提供 R5-19，则应为 None/NaN


def test_multiple_rows():
    df = pd.DataFrame([
        {
            "breath_index": i,
            "INSP_Volume": 0.3 + i,
            "EXP_Volume": 0.2 + i,
            "inspiration_start": 10 * i,
            "inspiration_end": 20 * i,
            "expiration_start": 21 * i,
            "expiration_end": 30 * i,
            "R5-19_INSP": 0.1 + i,
            "R5_INSP": 0.2 + i,
            "R19_INSP": 0.3 + i,
        } for i in range(3)
    ])
    result = reshape_for_visualization(df)
    # 每行应生成 6 segment + 1 空行 - 1 共 6 行（排除第一个标题）
    assert len(result) >= (3 * (6 + 1) - 1)


def test_empty_dataframe():
    df = pd.DataFrame()
    result = reshape_for_visualization(df)
    assert isinstance(result, pd.DataFrame)
    assert result.empty


def test_nan_in_fields():
    df = pd.DataFrame([{
        "breath_index": 1,
        "INSP_Volume": float("nan"),
        "EXP_Volume": 0.5,
        "inspiration_start": 10,
        "inspiration_end": 50,
        "expiration_start": 51,
        "expiration_end": 90,
        "R5-19_INSP": float("nan"),
        "R5_INSP": 0.2,
        "R19_INSP": 0.3,
    }])
    result = reshape_for_visualization(df)
    assert pd.isna(result.loc[result["segment"] == "INSP", "INSP_Volume"].iloc[0])

