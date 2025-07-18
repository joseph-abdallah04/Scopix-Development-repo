import zipfile
from io import BytesIO
from typing import Dict


def write_zip_from_bytesio(files: Dict[str, BytesIO]) -> BytesIO:
    """
    将多个 BytesIO 文件写入一个 ZIP 并返回 BytesIO 对象（内存压缩包）。

    参数:
        files: Dict[str, BytesIO] - 键为文件名，值为 BytesIO 对象

    返回:
        zip_buf: BytesIO - 包含压缩内容的内存流（用于 FastAPI 下载）
    """
    zip_buf = BytesIO()

    try:
        with zipfile.ZipFile(zip_buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for filename, buf in files.items():
                if not isinstance(buf, BytesIO):
                    raise TypeError(f"[ERROR] '{filename}' 内容必须是 BytesIO 类型")
                buf.seek(0)
                zf.writestr(filename, buf.read())

        zip_buf.seek(0)
        return zip_buf

    except Exception as e:
        raise RuntimeError(f"[ERROR] 创建 ZIP 字节流失败: {e}") from e

