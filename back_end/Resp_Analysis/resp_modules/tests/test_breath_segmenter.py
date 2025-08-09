import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from breath_segmenter import BreathSegmenter  # 替换为你的模块名


def build_dummy_input(length=1000):
    """构造一个模拟 Flow_Filtered 信号的 DataFrame"""
    t = np.linspace(0, 10, length)
    signal = np.sin(2 * np.pi * 0.25 * t)  # 模拟呼吸信号
    return pd.DataFrame({ "Flow_Filtered": signal })


@patch("breath_segmenter.physio")
def test_segment_basic(mock_physio):
    df = build_dummy_input()

    # 构造带过零点的模拟信号
    signal = np.zeros(len(df))
    signal[299] = -1
    signal[300] = 1
    mock_physio.smooth_signal.return_value = signal

    mock_physio.detect_respiration_cycles.return_value = "cycles"
    mock_physio.compute_respiration_cycle_features.return_value = pd.DataFrame([
        {
            "inspi_index": 100, "expi_index": 300, "next_inspi_index": 600,
            "inspi_time": 1.0, "expi_time": 2.0, "next_inspi_time": 4.0,
            "inspi_duration": 1.0, "expi_duration": 2.0, "cycle_duration": 3.0,
            "inspi_volume": 0.5, "expi_volume": 0.4, "total_volume": 0.9,
            "inspi_amplitude": 1.0, "expi_amplitude": 0.8, "total_amplitude": 1.5
        },
        {
            "inspi_index": 601, "expi_index": 800, "next_inspi_index": 998,
            "inspi_time": 4.0, "expi_time": 5.0, "next_inspi_time": 6.0,
            "inspi_duration": 1.0, "expi_duration": 1.0, "cycle_duration": 2.0,
            "inspi_volume": 0.6, "expi_volume": 0.5, "total_volume": 1.1,
            "inspi_amplitude": 1.1, "expi_amplitude": 0.9, "total_amplitude": 1.8
        }
    ])
    mock_physio.clean_respiration_cycles.side_effect = lambda *a, **kw: a[2]

    seg = BreathSegmenter()
    out = seg.segment(df)

    assert isinstance(out, pd.DataFrame)
    assert len(out) == 2
    assert out.loc[0, "inspiration_start"] == 100
    assert out.loc[1, "inspiration_start"] == out.loc[0, "expiration_end"] + 1  # should be 301


def test_missing_flow_column():
    df = pd.DataFrame({"Other": [1, 2, 3]})
    seg = BreathSegmenter(flow_column="Flow_Filtered")
    out = seg.segment(df)
    assert out.empty


@patch("breath_segmenter.physio.smooth_signal", side_effect=RuntimeError("mock error"))
def test_smoothing_exception(mock_smooth):
    df = build_dummy_input()
    seg = BreathSegmenter()
    out = seg.segment(df)
    assert out.empty


@patch("breath_segmenter.physio")
def test_nearest_zero_logic(mock_physio):
    """测试 _nearest_zero 方法本身"""
    signal = np.array([1.0, 0.5, -0.5, -1.0])  # 过零点在 1~2 之间
    seg = BreathSegmenter()
    idx = seg._nearest_zero(signal, 2)
    assert idx in (1, 2)  # 应该在过零点附近


@patch("breath_segmenter.physio")
def test_segment_skip_invalid_row(mock_physio):
    """模拟返回 NaN 的周期，确保被跳过"""
    df = build_dummy_input()
    features = pd.DataFrame([
        {
            "inspi_index": np.nan, "expi_index": 300, "next_inspi_index": 600,
            "inspi_time": 1.0, "expi_time": 2.0, "next_inspi_time": 4.0,
            "inspi_duration": 1.0, "expi_duration": 2.0, "cycle_duration": 3.0,
            "inspi_volume": 0.5, "expi_volume": 0.4, "total_volume": 0.9,
            "inspi_amplitude": 1.0, "expi_amplitude": 0.8, "total_amplitude": 1.5
        }
    ])
    mock_physio.smooth_signal.return_value = np.zeros(len(df))
    mock_physio.detect_respiration_cycles.return_value = "cycles"
    mock_physio.compute_respiration_cycle_features.return_value = features
    mock_physio.clean_respiration_cycles.side_effect = lambda *a, **kw: a[2]

    seg = BreathSegmenter()
    out = seg.segment(df)
    assert out.empty

