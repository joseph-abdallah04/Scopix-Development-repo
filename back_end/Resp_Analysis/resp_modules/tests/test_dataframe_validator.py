import pytest
import pandas as pd
from io import BytesIO
from dataframe_validator import DataFrameValidator  # 替换为你的实际模块路径


# ---------- 工具函数 ----------

def make_valid_df(n=1000):
    return pd.DataFrame({
        "#": range(n),
        "Flow_Filtered": [1.0] * n,
        "R5": [0.1] * n,
        "X5": [0.2] * n,
        "R11": [0.3] * n,
        "X11": [0.4] * n,
        "R19": [0.5] * n,
        "X19": [0.6] * n,
        "Volume": [1.0] * n,
    })


def to_csv_bytes(df: pd.DataFrame, encoding="utf-8") -> bytes:
    return df.to_csv(sep="\t", index=False).encode(encoding)


def to_excel_bytes(df: pd.DataFrame) -> bytes:
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    return buffer.getvalue()


# ---------- 正确路径测试 ----------

def test_valid_csv():
    df = make_valid_df()
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert result["valid"] is True


def test_valid_excel():
    df = make_valid_df()
    content = to_excel_bytes(df)
    result = DataFrameValidator(content, ".xlsx").validate()
    assert result["valid"] is True


# ---------- 错误路径测试 ----------

def test_empty_file():
    validator = DataFrameValidator(b"", ".csv")
    result = validator.validate()
    assert not result["valid"]
    assert "no columns to parse" in result["message"].lower()


def test_missing_column():
    df = make_valid_df().drop(columns=["R5"])
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "Missing columns" in result["message"]


def test_extra_column():
    df = make_valid_df()
    df["Extra"] = 1
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "Unexpected columns" in result["message"]


def test_wrong_column_count():
    df = make_valid_df().drop(columns=["R5"]).rename(columns={"X5": "Alias"})
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "Missing columns" in result["message"]


def test_null_values():
    df = make_valid_df()
    df.loc[0, "R5"] = None
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "Nulls in columns" in result["message"]


def test_non_numeric_value():
    df = make_valid_df()
    df["R5"] = df["R5"].astype(object)
    df.loc[0, "R5"] = "bad"
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "Non-numeric" in result["message"]


def test_illegal_characters():
    df = make_valid_df()
    df["#"] = df["#"].astype(str)
    df.loc[0, "#"] = "\x01"  # 合法地注入非法字符
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "Illegal character" in result["message"]


def test_too_few_rows():
    df = make_valid_df(n=500)
    content = to_csv_bytes(df)
    result = DataFrameValidator(content, ".csv").validate()
    assert not result["valid"]
    assert "expected at least 1000" in result["message"]


# ---------- 编码与格式错误 ----------

def test_encoding_auto_detect():
    df = make_valid_df()
    content = to_csv_bytes(df, encoding="gbk")
    validator = DataFrameValidator(content, ".csv")
    result = validator.validate()
    assert result["valid"]


def test_unsupported_suffix():
    df = make_valid_df()
    content = to_csv_bytes(df)
    validator = DataFrameValidator(content, ".txt")
    result = validator.validate()
    assert not result["valid"]
    assert "Unsupported file type" in result["message"]

