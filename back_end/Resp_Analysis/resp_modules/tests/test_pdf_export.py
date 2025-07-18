import pytest
from io import BytesIO
import pandas as pd
from PIL import Image as PILImage
from pdf_gen import dataframe_and_image_to_pdf


def generate_sample_image_bytes() -> BytesIO:
    img = PILImage.new("RGB", (200, 100), color="blue")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


@pytest.fixture
def sample_dataframe():
    return pd.DataFrame({
        "A": [1, 2, None, 4, 5],
        "B": [6, 7, None, 9, 10],
    })


def test_only_image(sample_dataframe):
    img_buf = generate_sample_image_bytes()
    result = dataframe_and_image_to_pdf(pd.DataFrame(), img_buf)
    assert isinstance(result, BytesIO)
    assert result.tell() == 0 or result.getbuffer().nbytes > 0


def test_only_dataframe(sample_dataframe):
    result = dataframe_and_image_to_pdf(sample_dataframe, None)
    assert isinstance(result, BytesIO)
    assert result.tell() == 0 or result.getbuffer().nbytes > 0


def test_dataframe_with_image(sample_dataframe):
    img_buf = generate_sample_image_bytes()
    result = dataframe_and_image_to_pdf(sample_dataframe, img_buf)
    assert isinstance(result, BytesIO)
    assert result.tell() == 0 or result.getbuffer().nbytes > 0


def test_dataframe_with_empty_rows_split():
    df = pd.DataFrame({
        "A": [1, 2, None, None, 5, 6],
        "B": [10, 20, None, None, 50, 60],
    })
    img_buf = generate_sample_image_bytes()
    result = dataframe_and_image_to_pdf(df, img_buf)
    assert isinstance(result, BytesIO)
    assert result.getbuffer().nbytes > 0


def test_missing_column_error(sample_dataframe):
    with pytest.raises(ValueError, match="提取指定列失败"):
        dataframe_and_image_to_pdf(sample_dataframe, None, columns=["A", "Z"])  # Z 不存在


def test_invalid_image_format(sample_dataframe):
    bad_image = BytesIO(b"This is not an image!")
    with pytest.raises(ValueError, match="图像处理失败"):
        dataframe_and_image_to_pdf(sample_dataframe, bad_image)


def test_invalid_dataframe_structure():
    df = pd.DataFrame({
        "A": [[1, 2], [3, 4]],
        "B": [{}, {}],
    })
    img_buf = generate_sample_image_bytes()
    with pytest.raises(ValueError, match="PDF 构建失败"):
        dataframe_and_image_to_pdf(df, img_buf)

