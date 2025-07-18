import pandas as pd
import numpy as np
import pytest
from Impcalc import ImpCalc  # 请根据你的实际模块名替换

@pytest.fixture
def mock_valid_df():
    # 构造一个包含 R5、R19、Volume 的 DataFrame
    n = 100
    index = np.arange(n)
    df = pd.DataFrame({
        "R5": np.linspace(0.1, 0.5, n),
        "R19": np.linspace(0.2, 0.4, n),
        "Volume": np.linspace(1.0, 2.0, n),
    }, index=index)
    return df

@pytest.fixture
def mock_valid_breaths():
    # 呼吸周期索引必须匹配上面的 index 范围
    return pd.DataFrame([
        {
            "inspiration_start": 10,
            "inspiration_end": 30,
            "expiration_start": 31,
            "expiration_end": 50
        }
    ])

def test_calc_success(mock_valid_df, mock_valid_breaths):
    # 添加 X5 列，确保 freq 默认值可用
    mock_valid_df["X5"] = np.linspace(0.05, 0.15, mock_valid_df.shape[0])

    calc = ImpCalc()  # 使用默认 freq=["R5", "R19", "X5"]
    result = calc.calc(mock_valid_df, mock_valid_breaths)

    assert isinstance(result, pd.DataFrame)
    assert len(result) == 1
    assert "R5-19_TOTAL" in result.columns
    assert not result.isna().all().all()


def test_calc_missing_column(mock_valid_df, mock_valid_breaths):
    # 删除必要列之一
    df_missing = mock_valid_df.drop(columns=["R5"])
    calc = ImpCalc(freq=["5", "19"])
    result = calc.calc(df_missing, mock_valid_breaths)
    assert isinstance(result, pd.DataFrame)
    assert result.empty

def test_calc_invalid_breaths(mock_valid_df):
    # 呼吸周期索引超出 range
    breaths = pd.DataFrame([{
        "inspiration_start": 9999,
        "inspiration_end": 10000,
        "expiration_start": 10001,
        "expiration_end": 10002
    }])
    calc = ImpCalc()
    result = calc.calc(mock_valid_df, breaths)
    assert result.empty

def test_calc_boundary_breath():
    df = pd.DataFrame({
        "R5": np.linspace(0.1, 0.5, 100),
        "R19": np.linspace(0.2, 0.4, 100),
        "Volume": np.linspace(1.0, 2.0, 100),
        "X5": np.linspace(0.0, 0.1, 100),  # ✅ 添加 X5，确保默认 freq 不缺列
    }, index=np.arange(100))

    breaths = pd.DataFrame([{
        "inspiration_start": 0,
        "inspiration_end": 49,
        "expiration_start": 50,
        "expiration_end": 99,
    }])
    calc = ImpCalc()
    result = calc.calc(df, breaths)
    assert isinstance(result, pd.DataFrame)
    assert len(result) == 1


def test_calc_invalid_order():
    df = pd.DataFrame({
        "R5": np.linspace(0.1, 0.5, 100),
        "R19": np.linspace(0.2, 0.4, 100),
        "Volume": np.linspace(1.0, 2.0, 100),
    }, index=np.arange(100))

    breaths = pd.DataFrame([{
        "inspiration_start": 50,
        "inspiration_end": 30,  # 错误顺序
        "expiration_start": 31,
        "expiration_end": 20
    }])
    calc = ImpCalc()
    result = calc.calc(df, breaths)
    assert result.empty  # 或使用 try/except 包装

