# test_dataframe_bytesio.py
import pytest
import pandas as pd
from io import BytesIO
from dataframe_bytesio import dataframe_bytesio
import numpy as np



def test_valid_dataframe_with_index():
    df = pd.DataFrame({"A": [1, 2], "B": [3, 4]})
    buf = dataframe_bytesio(df, index=True)
    content = buf.getvalue().decode("utf-8")
    assert "A,B" in content
    assert "0,1,3" in content or "1,2,4" in content


def test_valid_dataframe_without_index():
    df = pd.DataFrame({"X": [9, 8]})
    buf = dataframe_bytesio(df, index=False)
    content = buf.getvalue().decode("utf-8")
    assert content.startswith("X")


def test_invalid_dataframe_type():
    with pytest.raises(ValueError) as excinfo:
        dataframe_bytesio("not a dataframe")  # type: ignore
    assert "Failed to encode DataFrame" in str(excinfo.value)


def test_invalid_encoding():
    df = pd.DataFrame({"text": ["正常", "漢字", "emoji 😊"]})
    with pytest.raises(ValueError) as excinfo:
        dataframe_bytesio(df, encoding="ascii")
    assert "Failed to encode DataFrame" in str(excinfo.value)


def test_empty_dataframe():
    df = pd.DataFrame()
    buf = dataframe_bytesio(df)
    assert isinstance(buf, BytesIO)
    assert buf.getvalue().decode("utf-8").strip() == ""


def test_special_characters_encoding_utf8():
    df = pd.DataFrame({"col": ["áéíóú", "你好", "😊"]})
    buf = dataframe_bytesio(df, encoding="utf-8")
    content = buf.getvalue().decode("utf-8")
    assert "áéíóú" in content
    assert "你好" in content
    assert "😊" in content


def test_large_dataframe():
    # 100万行 x 10 列的 DataFrame
    df = pd.DataFrame(np.random.randint(0, 1000, size=(1_000_000, 10)), columns=[f"col{i}" for i in range(10)])
    buf = dataframe_bytesio(df)
    content = buf.getvalue()
    # 简单校验开头和结尾是否有内容，避免空输出或异常
    assert content.startswith(b"col0")
    assert len(content) > 10_000_000  # 大概10MB以上


def test_dataframe_with_nan_and_inf():
    df = pd.DataFrame({
        "A": [1, 2, float("nan")],
        "B": [float("inf"), -float("inf"), 3]
    })
    buf = dataframe_bytesio(df, index=False, na_rep="NaN")
    content = buf.getvalue().decode("utf-8")
    assert "NaN" in content
    assert "inf" in content or "Inf" in content  # 可加更严格判断


def test_dataframe_with_object_column():
    df = pd.DataFrame({
        "mixed": [1, "string", {"a": 1}, [1, 2], None]
    })
    buf = dataframe_bytesio(df)
    content = buf.getvalue().decode("utf-8")
    assert "string" in content
    assert "{" in content or "[" in content  # 字典或列表以字符串形式存在


def test_dataframe_with_multiindex():
    arrays = [
        ["A", "A", "B", "B"],
        [1, 2, 1, 2]
    ]
    index = pd.MultiIndex.from_arrays(arrays, names=("letter", "number"))
    df = pd.DataFrame({"value": [10, 20, 30, 40]}, index=index)
    df_reset = df.reset_index()  # 重要：flatten index into columns
    buf = dataframe_bytesio(df_reset, index=False)
    content = buf.getvalue().decode("utf-8")
    assert "letter,number,value" in content



def test_dataframe_with_datetime_index():
    dates = pd.date_range("2025-01-01", periods=5)
    df = pd.DataFrame({"value": [1, 2, 3, 4, 5]}, index=dates)
    buf = dataframe_bytesio(df, index=True)
    content = buf.getvalue().decode("utf-8")
    assert "2025" in content
    assert "value" in content

