import pytest
import pandas as pd
import numpy as np
from io import BytesIO
from PIL import Image

from plotter import plot_r5_x5_volume  # ← 替换为你的模块路径


# ✅ 辅助函数：生成模拟数据
def create_mock_data(length=100, seed=42):
    np.random.seed(seed)
    index = pd.RangeIndex(start=0, stop=length)
    return pd.DataFrame({
        "R5": np.random.normal(0.3, 0.05, length),
        "X5": np.random.normal(-0.2, 0.05, length),
        "Volume": np.cumsum(np.random.normal(0.01, 0.002, length))
    }, index=index)


# ✅ 测试 1: 空 DataFrame 抛出 ValueError
def test_plot_r5_x5_volume_handles_empty_dataframe():
    empty_df = pd.DataFrame(columns=["R5", "X5", "Volume"])
    with pytest.raises(ValueError, match="empty"):
        plot_r5_x5_volume(empty_df)


# ✅ 测试 2: 正常随机数据 → 返回 PNG 图像
def test_plot_r5_x5_volume_with_random_data():
    df = create_mock_data()
    result = plot_r5_x5_volume(df)

    assert isinstance(result, BytesIO)

    img = Image.open(result)
    img.verify()
    assert img.format == "PNG"


# ✅ 测试 3: 缺失列应抛出 KeyError
@pytest.mark.parametrize("missing_column", ["R5", "X5", "Volume"])
def test_plot_r5_x5_volume_missing_column(missing_column):
    df = create_mock_data()
    df = df.drop(columns=[missing_column])
    with pytest.raises(KeyError):
        plot_r5_x5_volume(df)


# ✅ 测试 4: 数据中有 NaN（不应抛错，但图像可能有缺口）
def test_plot_r5_x5_volume_with_nan_values():
    df = create_mock_data()
    df.loc[5:10, "R5"] = np.nan  # 插入 NaN
    result = plot_r5_x5_volume(df)

    img = Image.open(result)
    img.verify()
    assert img.format == "PNG"


# ✅ 测试 5: 只有一行数据
def test_plot_r5_x5_volume_single_row():
    df = create_mock_data(length=1)
    result = plot_r5_x5_volume(df)

    img = Image.open(result)
    img.verify()
    assert img.format == "PNG"

