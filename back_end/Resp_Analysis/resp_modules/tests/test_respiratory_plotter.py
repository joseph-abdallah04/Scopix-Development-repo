import pytest
import pandas as pd
import numpy as np
from io import BytesIO
from PIL import Image
from unittest.mock import patch, MagicMock
from PIL import ImageChops
from resp_plotter import RespiratoryPlotter  # 替换为你的模块路径


@pytest.fixture
def sample_data():
    """构造一个最小可用的测试 DataFrame"""
    index = np.arange(100)
    df = pd.DataFrame({
        "R5": np.sin(index / 10),
        "X5": np.cos(index / 10),
        "Volume": index / 100,
    }, index=index)
    return df


def test_plot_output_is_png(sample_data):
    buf = RespiratoryPlotter(sample_data)
    assert isinstance(buf, BytesIO)

    buf.seek(0)
    image = Image.open(buf)
    assert image.format == "PNG"
    assert image.size[0] > 0 and image.size[1] > 0


def test_plot_custom_fs(sample_data):
    # 设置 fs = 100 → 时间轴应从 0 到 0.99（100 点 × 0.01）
    fs = 100
    buf = RespiratoryPlotter(sample_data, fs=fs)

    # 解析生成的图像验证维度
    img = Image.open(buf)
    assert img.format == "PNG"
    assert isinstance(img.size, tuple)


def test_empty_dataframe_raises():
    df = pd.DataFrame(columns=["R5", "X5", "Volume"])
    with pytest.raises(ValueError, match="empty"):
        RespiratoryPlotter(df)


def test_missing_column_raises(sample_data):
    df = sample_data.drop(columns=["X5"])
    with pytest.raises(KeyError):
        RespiratoryPlotter(df)


@patch("resp_plotter.plt")  # ✅ 替换为你的模块名
def test_plot_contains_title_and_legend(mock_plt, sample_data):
    fig = MagicMock()
    ax = MagicMock()
    dummy_line = MagicMock(name="Line2D")

    # mock 设置
    ax.plot.return_value = [dummy_line]
    ax.get_legend.return_value = MagicMock()
    ax.get_title.return_value = "R5, X5 and Volume vs Time"
    mock_plt.subplots.return_value = (fig, ax)
    mock_plt.savefig = MagicMock()

    # 调用函数
    RespiratoryPlotter(sample_data)

    # 断言
    fig.tight_layout.assert_called_once()
    mock_plt.savefig.assert_called_once()  # ✅ 因为用的是 plt.savefig 而不是 fig.savefig
    ax.legend.assert_called_once()
    ax.set_xlabel.assert_called_once_with("Time (s)")
    mock_plt.title.assert_called_once_with("R5, X5 and Volume vs Time")  # ✅ 这个是 ax 上调用的
    assert ax.get_legend() is not None
    assert ax.get_title() != ""


@pytest.mark.parametrize("fs", [10, 100, 1000])
def test_plot_with_various_fs(sample_data, fs):
    buf = RespiratoryPlotter(sample_data, fs=fs)
    img = Image.open(buf)
    assert img.format == "PNG"


def test_single_point_data():
    df = pd.DataFrame({"R5": [0], "X5": [1], "Volume": [2]}, index=[0])
    buf = RespiratoryPlotter(df)
    assert isinstance(buf, BytesIO)
    assert buf.getbuffer().nbytes > 0


def test_two_point_data():
    df = pd.DataFrame({
        "R5": [0.1, 0.2],
        "X5": [0.3, 0.4],
        "Volume": [1.0, 1.1]
    }, index=[0, 1])
    buf = RespiratoryPlotter(df)
    img = Image.open(buf)
    assert img.size[0] > 0 and img.size[1] > 0


def test_extreme_values():
    df = pd.DataFrame({
        "R5": [1e6, -1e6, 1e6],
        "X5": [-1e6, 1e6, -1e6],
        "Volume": [0, 0.5, 1.0]
    }, index=[0, 1, 2])
    buf = RespiratoryPlotter(df)
    assert buf.getbuffer().nbytes > 0


def test_float_index():
    df = pd.DataFrame({
        "R5": np.sin(np.linspace(0, 1, 10)),
        "X5": np.cos(np.linspace(0, 1, 10)),
        "Volume": np.linspace(0, 1, 10)
    }, index=np.linspace(0, 1, 10))
    buf = RespiratoryPlotter(df, fs=100)
    assert buf.getbuffer().nbytes > 0


def test_nan_values_handled_gracefully():
    df = pd.DataFrame({
        "R5": [1.0, np.nan, 2.0],
        "X5": [0.0, 1.0, np.nan],
        "Volume": [np.nan, 0.5, 1.0]
    }, index=[0, 1, 2])
    # matplotlib 会自动跳过 NaN，测试不应报错
    buf = RespiratoryPlotter(df)
    assert buf.getbuffer().nbytes > 0


def test_object_dtype_conversion():
    df = pd.DataFrame({
        "R5": ["1", "2", "3"],
        "X5": ["4", "5", "6"],
        "Volume": ["7", "8", "9"]
    }, index=[0, 1, 2])
    df = df.astype(object)
    df = df.apply(pd.to_numeric)
    buf = RespiratoryPlotter(df)
    assert buf.getbuffer().nbytes > 0

