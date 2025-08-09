import pandas as pd
import chardet
import io
import re

class DataFrameValidator:
    EXPECTED_COLUMNS = [
        "Flow_Filtered", "R5", "X5", "R11", "X11", "R19", "X19", "#", "Volume"
    ]
    NUMERIC_COLUMNS = [col for col in EXPECTED_COLUMNS if col != "#"]
    ILLEGAL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\u200b]")

    def __init__(self, content: bytes, suffix: str):
        self.content = content
        self.suffix = suffix.lower()
        self.df = None

    def validate(self) -> dict:
        try:
            self.df = self._read_dataframe()
            self._validate_dataframe()
            return {"valid": True, "message": f"Valid file. {len(self.df)} rows."}
        except Exception as e:
            return {"valid": False, "message": str(e)}

    def _read_dataframe(self) -> pd.DataFrame:
        if self.suffix == ".xlsx":
            return pd.read_excel(io.BytesIO(self.content), engine="openpyxl")
        if self.suffix == ".csv":
            try:
                return pd.read_csv(io.BytesIO(self.content), delimiter="\t", encoding="utf-8")
            except UnicodeDecodeError:
                enc = chardet.detect(self.content[:4096])["encoding"] or "utf-8"
                return pd.read_csv(io.BytesIO(self.content), delimiter="\t", encoding=enc)
        raise ValueError(f"Unsupported file type: {self.suffix}")

    def _validate_dataframe(self):
        df = self.df
        if df.empty:
            raise ValueError("File is empty")

        cols = set(df.columns)
        expected = set(self.EXPECTED_COLUMNS)
        if missing := expected - cols:
            raise ValueError(f"Missing columns: {', '.join(sorted(missing))}")
        if extra := cols - expected:
            raise ValueError(f"Unexpected columns: {', '.join(sorted(extra))}")
        if len(df.columns) != len(self.EXPECTED_COLUMNS):
            raise ValueError(f"Expected {len(self.EXPECTED_COLUMNS)} columns, got {len(df.columns)}")

        if df.isnull().any().any():
            raise ValueError(f"Nulls in columns: {', '.join(df.columns[df.isnull().any()])}")

        for col in self.NUMERIC_COLUMNS:
            if not pd.to_numeric(df[col], errors="coerce").notna().all():
                raise ValueError(f"Non-numeric values in column '{col}'")

        for col in df.columns:
            for i, val in enumerate(df[col]):
                if self.ILLEGAL_CHAR_PATTERN.search(str(val)):
                    raise ValueError(f"Illegal character in {col}[{i}]")

        if len(df) < 1000:
            raise ValueError(f"Only {len(df)} rows; expected at least 1000.")

