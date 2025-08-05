import pytest
import pandas as pd
import numpy as np
from breath_feature_reshaper import BreathFeatureReshaper  # 替换为实际模块名


# ---------------------- Fixtures ----------------------

@pytest.fixture
def minimal_valid_df():
    return pd.DataFrame({
        "breath_index": [1],
        "INSP_Volume": [0.5],
        "EXP_Volume": [0.4],
        "inspiration_start": [10],
        "inspiration_end": [20],
        "expiration_start": [21],
        "expiration_end": [30],
        "R5-19_INSP": [0.1], "R5-19_EXP": [0.2], "R5-19_INSP-EXP": [0.3],
        "R5-19_TOTAL": [0.4], "R5-19_MAX": [0.5], "R5-19_MIN": [0.0], "R5-19_MAX-MIN": [0.5],
        "R5_INSP": [1], "R5_EXP": [2], "R5_INSP-EXP": [3], "R5_TOTAL": [4],
        "R5_MAX": [5], "R5_MIN": [0], "R5_MAX-MIN": [5],
        "R19_INSP": [11], "R19_EXP": [12], "R19_INSP-EXP": [13], "R19_TOTAL": [14],
        "R19_MAX": [15], "R19_MIN": [10], "R19_MAX-MIN": [5],
        "X5_INSP": [-0.1], "X5_EXP": [-0.2], "X5_INSP-EXP": [-0.3],
        "X5_TOTAL": [-0.4], "X5_MAX": [-0.1], "X5_MIN": [-0.5], "X5_MAX-MIN": [0.4],
    })


# ---------------------- Tests ----------------------

def test_valid_output_shape(minimal_valid_df):
    df_out = BreathFeatureReshaper(minimal_valid_df)
    assert isinstance(df_out, pd.DataFrame)
    assert len(df_out) == 7  # 1 row * 7 segments
    assert set(df_out["SEGMENT"]) == {
        "INSP", "EXP", "INSP-EXP", "TOTAL", "MAX", "MIN", "MAX-MIN"
    }


def test_output_column_values(minimal_valid_df):
    df_out = BreathFeatureReshaper(minimal_valid_df)
    insp_row = df_out[df_out["SEGMENT"] == "INSP"].iloc[0]
    assert insp_row["INSP_VOLUME"] == 0.5
    assert insp_row["EXP_VOLUME"] == 0.4
    assert insp_row["INSPIRATION_START"] == 10
    assert insp_row["EXPIRATION_END"] == 30

    exp_row = df_out[df_out["SEGMENT"] == "EXP"].iloc[0]
    assert exp_row["INSP_VOLUME"] == ""


@pytest.mark.parametrize("missing_col", [
    "breath_index", "INSP_Volume", "EXP_Volume",
    "inspiration_start", "inspiration_end",
    "expiration_start", "expiration_end",
])
def test_missing_required_columns_raises(missing_col, minimal_valid_df):
    df = minimal_valid_df.drop(columns=[missing_col])
    with pytest.raises(KeyError) as e:
        BreathFeatureReshaper(df)
    assert missing_col in str(e.value)


def test_missing_metric_columns_filled_with_empty(minimal_valid_df):
    df = minimal_valid_df.drop(columns=["R5_MAX"])
    result = BreathFeatureReshaper(df)
    max_row = result[result["SEGMENT"] == "MAX"].iloc[0]
    assert max_row["R5"] == ""


def test_empty_dataframe_returns_empty():
    empty = pd.DataFrame(columns=[
        "breath_index", "INSP_Volume", "EXP_Volume",
        "inspiration_start", "inspiration_end",
        "expiration_start", "expiration_end",
    ])
    df_out = BreathFeatureReshaper(empty)
    assert df_out.empty


def test_nan_values_propagate_correctly(minimal_valid_df):
    df = minimal_valid_df.copy()
    df.loc[0, "R5_INSP"] = np.nan
    df_out = BreathFeatureReshaper(df)
    assert np.isnan(df_out[df_out["SEGMENT"] == "INSP"].iloc[0]["R5"])


def test_multiple_rows(minimal_valid_df):
    df = pd.concat([minimal_valid_df] * 2, ignore_index=True)
    df_out = BreathFeatureReshaper(df)
    assert len(df_out) == 14  # 2 rows * 7 segments
    assert set(df_out["BREATH_INDEX"]) == {1}

def test_required_column_type_flexibility(minimal_valid_df):
    df = minimal_valid_df.copy()
    # 将数字字段转为字符串类型
    df["INSP_Volume"] = df["INSP_Volume"].astype(str)
    df_out = BreathFeatureReshaper(df)
    assert df_out[df_out["SEGMENT"] == "INSP"].iloc[0]["INSP_VOLUME"] == "0.5"


def test_required_column_order_irrelevant(minimal_valid_df):
    df = minimal_valid_df[minimal_valid_df.columns[::-1]]  # 反转列顺序
    df_out = BreathFeatureReshaper(df)
    assert not df_out.empty
    assert "SEGMENT" in df_out.columns


def test_missing_all_metrics_still_returns_valid(minimal_valid_df):
    df = minimal_valid_df[[
        "breath_index", "INSP_Volume", "EXP_Volume",
        "inspiration_start", "inspiration_end",
        "expiration_start", "expiration_end"
    ]]
    df_out = BreathFeatureReshaper(df)
    assert df_out.shape[0] == 7  # 7 segments
    assert df_out["R5"].eq("").all()  # 所有指标字段为空


def test_non_string_column_names():
    df = pd.DataFrame({
        0: [1], 1: [0.5], 2: [0.4], 3: [1], 4: [2], 5: [3], 6: [4]
    })
    df.columns = [
        "breath_index", "INSP_Volume", "EXP_Volume",
        "inspiration_start", "inspiration_end",
        "expiration_start", "expiration_end"
    ]
    df_out = BreathFeatureReshaper(df)
    assert len(df_out) == 7


def test_duplicate_columns_uses_first(minimal_valid_df):
    # 添加重复列，pandas 默认会在后面加 .1
    df = minimal_valid_df.copy()
    df["INSP_Volume.1"] = [99]
    df_out = BreathFeatureReshaper(df)
    assert df_out[df_out["SEGMENT"] == "INSP"].iloc[0]["INSP_VOLUME"] == 0.5


def test_boolean_like_values():
    df = pd.DataFrame({
        "breath_index": [1],
        "INSP_Volume": [True],
        "EXP_Volume": [False],
        "inspiration_start": [0],
        "inspiration_end": [1],
        "expiration_start": [1],
        "expiration_end": [2],
    })
    df_out = BreathFeatureReshaper(df)
    row = df_out[df_out["SEGMENT"] == "INSP"].iloc[0]
    assert bool(row["INSP_VOLUME"]) is True
    assert bool(row["EXP_VOLUME"]) is False


def test_output_column_names_complete(minimal_valid_df):
    df_out = BreathFeatureReshaper(minimal_valid_df)
    expected_columns = {
        "BREATH_INDEX", "SEGMENT", "R5-19", "R5", "R19", "X5",
        "INSP_VOLUME", "EXP_VOLUME",
        "INSPIRATION_START", "INSPIRATION_END",
        "EXPIRATION_START", "EXPIRATION_END",
    }
    assert expected_columns.issubset(df_out.columns)


def test_missing_required_columns_error_type(minimal_valid_df):
    df = minimal_valid_df.drop(columns=["breath_index"])
    with pytest.raises(KeyError) as excinfo:
        BreathFeatureReshaper(df)
    assert isinstance(excinfo.value.args[0], str)
    assert "breath_index" in excinfo.value.args[0]

