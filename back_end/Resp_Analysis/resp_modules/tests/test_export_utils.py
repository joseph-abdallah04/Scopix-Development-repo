import pytest
import pandas as pd
import numpy as np
from io import BytesIO
import zipfile
import orjson
from reportlab.platypus import Image
from export_utils import ExportUtils  # ← 修改为你实际的模块路径


# ------------------------
# Fixtures
# ------------------------

@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "A": [1, 2, 3],
        "B": [4, None, 6],
        "C": [7, 8, 9]
    }, index=[0, 1, 2])


@pytest.fixture
def image_bytes():
    from PIL import Image as PILImage
    img = PILImage.new("RGB", (100, 100), color="blue")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


# ------------------------
# Test: dataframe_to_csv_bytes
# ------------------------

def test_csv_bytes_output(sample_df):
    buf = ExportUtils.dataframe_to_csv_bytes(sample_df, index=False)
    content = buf.getvalue().decode("utf-8")
    assert "A,B,C" in content
    assert "2,,8" in content


def test_csv_bytes_encoding_error(sample_df, monkeypatch):
    monkeypatch.setattr(pd.DataFrame, "to_csv", lambda *args, **kwargs: "✓")
    with pytest.raises(ValueError, match="Failed to encode DataFrame"):
        ExportUtils.dataframe_to_csv_bytes(sample_df, encoding="invalid-encoding")


# ------------------------
# Test: dataframe_to_plot_json
# ------------------------

def test_plot_json_output(sample_df):
    df = sample_df.drop(columns="C")
    result = b"".join(ExportUtils.dataframe_to_plot_json(df, ["A", "B"], sample_rate=1.0))
    json = orjson.loads(result)
    assert isinstance(json, list)
    assert json[0]["id"] == "A"
    assert "x" in json[0]["data"][0]
    assert "y" in json[0]["data"][0]


def test_plot_json_invalid_column(sample_df):
    with pytest.raises(ValueError, match="Column 'Z' not found"):
        list(ExportUtils.dataframe_to_plot_json(sample_df, ["Z"]))


def test_plot_json_non_numeric_index(sample_df):
    df = sample_df.copy()
    df.index = ["a", "b", "c"]
    with pytest.raises(ValueError, match="Index must be numeric"):
        list(ExportUtils.dataframe_to_plot_json(df, ["A"]))


# ------------------------
# Test: dataframe_and_image_to_pdf
# ------------------------

def test_pdf_export_with_image_and_columns(sample_df, image_bytes):
    buf = ExportUtils.dataframe_and_image_to_pdf(sample_df, image_bytes, columns=["A", "B"])
    assert isinstance(buf, BytesIO)
    content = buf.getvalue()
    assert content.startswith(b"%PDF")


def test_pdf_export_invalid_column(sample_df, image_bytes):
    with pytest.raises(ValueError, match="Column filtering failed"):
        ExportUtils.dataframe_and_image_to_pdf(sample_df, image_bytes, columns=["X"])


def test_pdf_export_invalid_image(sample_df):
    bad_image = BytesIO(b"not an image")
    with pytest.raises(ValueError, match="Image processing failed"):
        ExportUtils.dataframe_and_image_to_pdf(sample_df, bad_image)


# ------------------------
# Test: write_zip
# ------------------------

def test_write_zip_success(sample_df):
    files = {
        "data.csv": ExportUtils.dataframe_to_csv_bytes(sample_df)
    }
    zip_buf = ExportUtils.write_zip(files)
    with zipfile.ZipFile(zip_buf, "r") as zf:
        assert "data.csv" in zf.namelist()
        content = zf.read("data.csv").decode("utf-8")
        assert "A,B,C" in content


def test_write_zip_invalid_input_type():
    with pytest.raises(TypeError):
        ExportUtils.write_zip({"not_bytesio": b"123"})


def test_write_zip_internal_error(monkeypatch, sample_df):
    files = {
        "broken.csv": ExportUtils.dataframe_to_csv_bytes(sample_df)
    }

    class FakeZip:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def writestr(self, name, data): raise RuntimeError("boom")

    monkeypatch.setattr(zipfile, "ZipFile", FakeZip)

    with pytest.raises(RuntimeError, match="Failed to create ZIP"):
        ExportUtils.write_zip(files)


# ------------------------
# Test: internal helpers (optional)
# ------------------------

def test_split_dataframe_with_blank_rows():
    df = pd.DataFrame({
        "A": [1, 2, None, None, 5],
        "B": [1, 2, None, None, 5]
    })
    parts = ExportUtils._split_dataframe(df)
    assert len(parts) == 2
    assert all(isinstance(p, pd.DataFrame) for p in parts)


def test_process_image_scaling(image_bytes):
    img = ExportUtils._process_image(image_bytes, page_size=(400, 300))
    assert isinstance(img, Image)
    assert img.drawWidth > 0 and img.drawHeight > 0

