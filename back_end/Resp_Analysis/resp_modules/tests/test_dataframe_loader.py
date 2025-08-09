import pytest
import pandas as pd
from pathlib import Path
from io import BytesIO
from unittest.mock import patch
from dataframe_loader import DataFrameLoader


@pytest.fixture
def valid_df():
    return pd.DataFrame({
        "#": [0, 1],
        "A": [1, 2],
        "B": [3, 4],
    }).set_index("#")


@pytest.fixture
def csv_bytes(valid_df):
    return valid_df.to_csv(sep="\t").encode("utf-8")


@pytest.fixture
def excel_bytes(valid_df):
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        valid_df.to_excel(writer)
    return buffer.getvalue()


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(True, ""))
def test_load_csv_file(mock_validate, tmp_path, csv_bytes):
    path = tmp_path / "sample.csv"
    path.write_bytes(csv_bytes)

    loader = DataFrameLoader()
    result = loader.load(path)

    assert isinstance(result, dict)
    assert "sample" in result
    assert isinstance(result["sample"], pd.DataFrame)
    assert mock_validate.called


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(True, ""))
def test_load_xlsx_file(mock_validate, tmp_path, excel_bytes):
    path = tmp_path / "sample.xlsx"
    path.write_bytes(excel_bytes)

    loader = DataFrameLoader()
    result = loader.load(path)

    assert "sample" in result
    assert isinstance(result["sample"], pd.DataFrame)


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(True, ""))
def test_load_directory(mock_validate, tmp_path, csv_bytes, excel_bytes):
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "a.csv").write_bytes(csv_bytes)
    (tmp_path / "data" / "b.xlsx").write_bytes(excel_bytes)
    (tmp_path / "data" / "ignore.txt").write_text("not a dataframe")

    loader = DataFrameLoader()
    result = loader.load(tmp_path / "data")

    assert set(result.keys()) == {"a", "b"}
    assert all(isinstance(df, pd.DataFrame) for df in result.values())


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(True, ""))
def test_load_bytes_csv(mock_validate, csv_bytes):
    loader = DataFrameLoader()
    df = loader.load_bytes(csv_bytes, ".csv")
    assert isinstance(df, pd.DataFrame)


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(True, ""))
def test_load_bytes_excel(mock_validate, excel_bytes):
    loader = DataFrameLoader()
    df = loader.load_bytes(excel_bytes, ".xlsx")
    assert isinstance(df, pd.DataFrame)


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(False, "invalid"))
def test_validation_fails(mock_validate, csv_bytes):
    loader = DataFrameLoader()
    with pytest.raises(ValueError, match="Validation failed"):
        loader.load_bytes(csv_bytes, ".csv")


def test_invalid_suffix(csv_bytes):
    loader = DataFrameLoader()
    with pytest.raises(ValueError, match="Unsupported file type"):
        loader.load_bytes(csv_bytes, ".txt")


def test_file_not_found():
    loader = DataFrameLoader()
    with pytest.raises(FileNotFoundError):
        loader.load("nonexistent.csv")


def test_encoding_error(tmp_path):
    bad_bytes = "编号\t值\n一\t一百".encode("gbk")
    path = tmp_path / "bad.csv"
    path.write_bytes(bad_bytes)

    loader = DataFrameLoader(encoding="utf-8")
    with pytest.raises(ValueError, match="Failed to read"):
        loader.load(path)


@patch("dataframe_loader.DataFrameValidator.validate", return_value=(True, ""))
def test_usecols_and_index(mock_validate, tmp_path):
    df = pd.DataFrame({
        "#": [0, 1, 2],
        "A": [10, 20, 30],
        "B": [100, 200, 300]
    })
    path = tmp_path / "partial.csv"
    df.to_csv(path, sep="\t", index=False)

    loader = DataFrameLoader(index_col=None, usecols=["A", "B"])
    result = loader.load(path)
    assert list(result["partial"].columns) == ["A", "B"]

