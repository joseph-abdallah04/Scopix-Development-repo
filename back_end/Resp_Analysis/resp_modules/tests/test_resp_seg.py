import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from Resp_seg import Resp_seg


@pytest.fixture
def mock_input_df():
    # 创建一个简化的测试 DataFrame
    return pd.DataFrame({
        "Flow_Filtered": np.linspace(0, 1, 1000) * np.sin(np.linspace(0, 4*np.pi, 1000))
    })


@pytest.fixture
def mock_cycles():
    return pd.DataFrame({
        "inspi_index": [100, 600],
        "expi_index": [300, 800],
        "next_inspi_index": [100, 600],
        "inspi_time": [0.5, 3.0],
        "expi_time": [1.5, 4.0],
        "next_inspi_time": [2.5, 5.0],
        "inspi_duration": [1.0, 1.0],
        "expi_duration": [1.0, 1.0],
        "cycle_duration": [2.0, 2.0],
        "inspi_volume": [1.2, 1.1],
        "expi_volume": [1.1, 1.0],
        "total_volume": [2.3, 2.1],
        "inspi_amplitude": [0.5, 0.4],
        "expi_amplitude": [0.4, 0.3],
        "total_amplitude": [0.9, 0.7],
    })

@patch("Resp_seg.physio")
def test_seg_breaths_success(mock_physio, mock_input_df, mock_cycles):
    """测试正常运行流程"""
    mock_physio.smooth_signal.return_value = mock_input_df["Flow_Filtered"].values
    mock_physio.detect_respiration_cycles.return_value = mock_cycles
    mock_physio.compute_respiration_cycle_features.return_value = mock_cycles
    mock_physio.clean_respiration_cycles.return_value = mock_cycles

    seg = Resp_seg()
    result = seg.seg_breaths(mock_input_df)

    assert isinstance(result, pd.DataFrame)
    assert len(result) == 2
    assert "inspiration_start" in result.columns
    assert result["inspiration_start"].iloc[0] == 100
    assert result["inspiration_start"].iloc[1] == result["expiration_end"].iloc[0] + 1

@patch("Resp_seg.physio")
def test_missing_column_returns_empty(mock_physio):
    """测试缺失列时返回空表"""
    df = pd.DataFrame({
        "SomeOtherColumn": [1, 2, 3]
    })

    seg = Resp_seg(flow_column="Flow_Filtered")
    result = seg.seg_breaths(df)

    assert isinstance(result, pd.DataFrame)
    assert result.empty


@patch("Resp_seg.physio")
def test_smooth_signal_exception(mock_physio, mock_input_df):
    """测试平滑阶段出错"""
    mock_physio.smooth_signal.side_effect = Exception("Smooth failed")

    seg = Resp_seg()
    result = seg.seg_breaths(mock_input_df)

    assert isinstance(result, pd.DataFrame)
    assert result.empty


@patch("Resp_seg.physio")
def test_cycle_detection_exception(mock_physio, mock_input_df):
    """测试周期检测出错"""
    mock_physio.smooth_signal.return_value = mock_input_df["Flow_Filtered"].values
    mock_physio.detect_respiration_cycles.side_effect = Exception("Cycle failed")

    seg = Resp_seg()
    result = seg.seg_breaths(mock_input_df)

    assert result.empty


@patch("Resp_seg.physio")
def test_feature_extraction_exception(mock_physio, mock_input_df):
    """测试特征提取出错"""
    mock_physio.smooth_signal.return_value = mock_input_df["Flow_Filtered"].values
    mock_physio.detect_respiration_cycles.return_value = pd.DataFrame({
        "inspi_index": [10],
        "expi_index": [40],
        "next_inspi_index": [80],
        "inspi_time": [0.05],
        "expi_time": [0.2],
        "next_inspi_time": [0.4],
    })
    mock_physio.compute_respiration_cycle_features.side_effect = Exception("Feature fail")

    seg = Resp_seg()
    result = seg.seg_breaths(mock_input_df)

    assert result.empty

@patch("Resp_seg.physio")
def test_clean_cycles_exception(mock_physio, mock_input_df, mock_cycles):
    """测试清洗周期失败"""
    mock_physio.smooth_signal.return_value = mock_input_df["Flow_Filtered"].values
    mock_physio.detect_respiration_cycles.return_value = mock_cycles
    mock_physio.compute_respiration_cycle_features.return_value = mock_cycles
    mock_physio.clean_respiration_cycles.side_effect = Exception("Clean fail")

    seg = Resp_seg()
    result = seg.seg_breaths(mock_input_df)

    assert result.empty


@patch("Resp_seg.physio")
def test_generate_breath_table_exception(mock_physio, mock_input_df):
    """测试生成呼吸表阶段失败（例如 row 缺少字段）"""
    # 构造一个不完整的周期数据触发 KeyError
    bad_cycles = pd.DataFrame({
        "inspi_index": [10],
        "expi_index": [30],
        # 缺少 next_inspi_index 等字段
    })

    mock_physio.smooth_signal.return_value = mock_input_df["Flow_Filtered"].values
    mock_physio.detect_respiration_cycles.return_value = bad_cycles
    mock_physio.compute_respiration_cycle_features.return_value = bad_cycles
    mock_physio.clean_respiration_cycles.return_value = bad_cycles

    seg = Resp_seg()
    result = seg.seg_breaths(mock_input_df)

    assert result.empty


@patch("Resp_seg.physio")
def test_multiple_cycles_output(mock_physio):
    """测试多个周期处理结果"""
    flow_data = np.tile(np.sin(np.linspace(0, 2 * np.pi, 200)), 3)
    df = pd.DataFrame({"Flow_Filtered": flow_data})

    cycles = pd.DataFrame({
        "inspi_index": [10, 110],
        "expi_index": [40, 140],
        "next_inspi_index": [80, 180],
        "inspi_time": [0.05, 0.55],
        "expi_time": [0.2, 0.7],
        "next_inspi_time": [0.4, 0.9],
        "inspi_duration": [0.15, 0.15],
        "expi_duration": [0.2, 0.2],
        "cycle_duration": [0.35, 0.35],
        "inspi_volume": [1.1, 1.2],
        "expi_volume": [1.0, 1.1],
        "total_volume": [2.1, 2.3],
        "inspi_amplitude": [0.4, 0.5],
        "expi_amplitude": [0.3, 0.4],
        "total_amplitude": [0.7, 0.9],
    })

    mock_physio.smooth_signal.return_value = df["Flow_Filtered"].values
    mock_physio.detect_respiration_cycles.return_value = cycles
    mock_physio.compute_respiration_cycle_features.return_value = cycles
    mock_physio.clean_respiration_cycles.return_value = cycles

    seg = Resp_seg()
    result = seg.seg_breaths(df)

    assert len(result) == 2
    assert all(col in result.columns for col in [
        "inspiration_start", "expiration_end_time", "total_volume"
    ])
    assert result["inspiration_start"].iloc[1] == result["expiration_end"].iloc[0] + 1


@patch("Resp_seg.physio")
def test_empty_input_df_returns_empty(mock_physio):
    """空输入表应返回空结果"""
    empty_df = pd.DataFrame(columns=["Flow_Filtered"])

    seg = Resp_seg()
    result = seg.seg_breaths(empty_df)

    assert result.empty


@patch("Resp_seg.physio")
def test_nan_values_in_flow_filtered(mock_physio):
    """测试 Flow_Filtered 含 NaN 时的处理"""
    df = pd.DataFrame({
        "Flow_Filtered": [0.1, np.nan, 0.3, np.nan, 0.5, 0.6, 0.2, 0.3, 0.4, 0.5]
    })

    mock_cycles = pd.DataFrame({
        "inspi_index": [0],
        "expi_index": [2],
        "next_inspi_index": [8],
        "inspi_time": [0.0],
        "expi_time": [0.1],
        "next_inspi_time": [0.2],
        "inspi_duration": [0.1],
        "expi_duration": [0.1],
        "cycle_duration": [0.2],
        "inspi_volume": [1.0],
        "expi_volume": [1.1],
        "total_volume": [2.1],
        "inspi_amplitude": [0.4],
        "expi_amplitude": [0.5],
        "total_amplitude": [0.9],
    })

    mock_physio.smooth_signal.return_value = df["Flow_Filtered"].fillna(0).values
    mock_physio.detect_respiration_cycles.return_value = mock_cycles
    mock_physio.compute_respiration_cycle_features.return_value = mock_cycles
    mock_physio.clean_respiration_cycles.return_value = mock_cycles

    seg = Resp_seg()
    result = seg.seg_breaths(df)

    assert not result.empty
    assert result["inspiration_start"].iloc[0] == 0
    assert result["expiration_end"].iloc[0] == 8

