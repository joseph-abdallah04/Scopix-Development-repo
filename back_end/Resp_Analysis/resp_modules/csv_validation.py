import pandas as pd
import chardet
import io
import logging
import re

logger = logging.getLogger(__name__)

EXPECTED_COLUMNS = [
    "Flow_Filtered", "R5", "X5", "R11", "X11", "R19", "X19", "#", "Volume"
]
EXPECTED_COLUMNS_SET = set(EXPECTED_COLUMNS)
NUMERIC_COLUMNS = [col for col in EXPECTED_COLUMNS if col != "#"]
ILLEGAL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\u200b]")

def contains_illegal_characters(cell: str) -> bool:
    return bool(ILLEGAL_CHAR_PATTERN.search(str(cell)))

def detect_encoding_from_bytes(data: bytes, num_bytes: int = 4096) -> str:
    result = chardet.detect(data[:num_bytes])
    return result["encoding"] or "utf-8"

def validate_csv_bytes(content: bytes) -> dict:
    """
    Validates uploaded CSV file content (bytes from UploadFile).
    Returns dict with {"valid": bool, "message": str}
    """
    try:
        # Try utf-8 first
        try:
            df = pd.read_csv(io.BytesIO(content), delimiter='\t', encoding='utf-8')
        except UnicodeDecodeError:
            encoding = detect_encoding_from_bytes(content)
            df = pd.read_csv(io.BytesIO(content), delimiter='\t', encoding=encoding)

        if df.empty:
            return {"valid": False, "message": "File is empty"}

        actual_columns = df.columns
        actual_columns_set = set(actual_columns)
        missing = EXPECTED_COLUMNS_SET - actual_columns_set
        extra = actual_columns_set - EXPECTED_COLUMNS_SET

        if missing:
            return {"valid": False, "message": f"Missing required columns: {', '.join(sorted(missing))}"}
        if extra:
            return {"valid": False, "message": f"Unexpected columns found: {', '.join(sorted(extra))}"}
        if len(actual_columns) != len(EXPECTED_COLUMNS):
            return {"valid": False, "message": f"Column count mismatch. Expected {len(EXPECTED_COLUMNS)}, found {len(actual_columns)}"}

        if df.isnull().any().any():
            null_cols = df.columns[df.isnull().any()].tolist()
            return {"valid": False, "message": f"Empty cells found in columns: {', '.join(null_cols)}"}

        for col in NUMERIC_COLUMNS:
            if not pd.to_numeric(df[col], errors='coerce').notna().all():
                return {"valid": False, "message": f"Column '{col}' contains non-numeric values"}

        # Check for illegal characters
        for col in df.columns:
            for i, val in enumerate(df[col]):
                if contains_illegal_characters(val):
                    return {"valid": False, "message": f"Illegal characters found in {col}[{i}]"}
        
        if len(df) < 1000:
            return {"valid": False, "message": f"Only {len(df)} rows found. Expected at least 1000"}

        return {"valid": True, "message": f"File validation successful. {len(df)} rows processed."}

    except Exception as e:
        logger.error(f"CSV validation error: {e}")
        return {"valid": False, "message": f"Error processing file: {str(e)}"}

