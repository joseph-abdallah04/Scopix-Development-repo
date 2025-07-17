import pandas as pd
from io import BytesIO
from typing import Optional

def dataframe_bytesio(df: pd.DataFrame, index: bool = False, encoding: str = "utf-8", na_rep: Optional[str] = None) -> BytesIO:
    """
    将 DataFrame 转换为字节流 CSV，支持指定是否包含索引和编码格式。
    出错时抛出详细异常信息。
    """
    try:
        csv_bytes = df.to_csv(index=index, na_rep=na_rep).encode(encoding)
    except (UnicodeEncodeError, AttributeError, TypeError) as e:
        raise ValueError(f"[ERROR] Failed to encode DataFrame to CSV bytes: {e}")
    
    try:
        buf = BytesIO()
        buf.write(csv_bytes)
        buf.seek(0)
        return buf
    except Exception as e:
        raise IOError(f"[ERROR] Failed to write CSV bytes to buffer: {e}")

