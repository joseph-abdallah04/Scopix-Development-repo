import pytest
from io import BytesIO
import zipfile
import os
from pathlib import Path
from zipper import write_zip_from_bytesio

@pytest.fixture
def sample_bytesio_dict():
    return {
        "file1.txt": BytesIO(b"Hello World"),
        "file2.csv": BytesIO(b"a,b,c\n1,2,3\n4,5,6")
    }

def test_write_zip_success(tmp_path, sample_bytesio_dict):
    output_zip = tmp_path / "test.zip"
    write_zip_from_bytesio(str(output_zip), sample_bytesio_dict)

    assert output_zip.exists()

    # 检查 zip 内容
    with zipfile.ZipFile(output_zip, "r") as zf:
        names = zf.namelist()
        assert "file1.txt" in names
        assert "file2.csv" in names
        assert zf.read("file1.txt") == b"Hello World"
        assert zf.read("file2.csv") == b"a,b,c\n1,2,3\n4,5,6"

def test_invalid_bytesio_type(tmp_path):
    output_zip = tmp_path / "bad.zip"
    bad_data = {
        "invalid.txt": "this is a string, not BytesIO"
    }

    with pytest.raises(RuntimeError) as exc_info:
        write_zip_from_bytesio(str(output_zip), bad_data)

    # 确认错误消息中包含关键词
    msg = str(exc_info.value)
    assert "BytesIO" in msg
    assert "invalid.txt" in msg

    # 多层 __cause__ 检查
    cause_lvl1 = exc_info.value.__cause__  # inner RuntimeError
    assert isinstance(cause_lvl1, RuntimeError)
    cause_lvl2 = cause_lvl1.__cause__      # inner-most TypeError
    assert isinstance(cause_lvl2, TypeError)


def test_corrupt_bytesio_content(tmp_path):
    class FakeBuffer:
        def read(self):
            raise IOError("Simulated read failure")

        def seek(self, pos):
            pass

    output_zip = tmp_path / "corrupt.zip"
    files = {
        "broken.txt": FakeBuffer()
    }

    with pytest.raises(RuntimeError, match=r".*写入文件 'broken.txt' 到 zip 时出错.*"):
        write_zip_from_bytesio(str(output_zip), files)

def test_write_zip_io_error(monkeypatch, tmp_path, sample_bytesio_dict):
    # 模拟 ZipFile 无法创建的场景（如路径不可写）
    def mock_zipfile(*args, **kwargs):
        raise OSError("Simulated ZIP creation failure")

    monkeypatch.setattr(zipfile, "ZipFile", mock_zipfile)

    output_zip = tmp_path / "fail.zip"
    with pytest.raises(RuntimeError, match=r".*创建或写入 zip 文件.*fail.zip.*"):
        write_zip_from_bytesio(str(output_zip), sample_bytesio_dict)

