from dataclasses import dataclass, field
from pathlib import Path
from typing import Union, Dict, Optional, List, IO
import pandas as pd
import io
from .dataframe_validator import DataFrameValidator

@dataclass
class DataFrameLoader:
    delimiter: str = '\t'
    suffixes: List[str] = field(default_factory=lambda: ['.csv', '.xlsx'])
    index_col: Optional[str] = '#'
    usecols: Optional[List[str]] = None
    encoding: str = "utf-8"

    def load(self, path: Union[str, Path]) -> Dict[str, pd.DataFrame]:
        path = Path(path)
        if path.is_file():
            return {path.stem: self._read(path, path.suffix.lower(), path.name)}
        if path.is_dir():
            return {
                f.stem: self._read(f, f.suffix.lower(), f.name)
                for f in path.iterdir()
                if f.is_file() and f.suffix.lower() in self.suffixes
            }
        raise FileNotFoundError(f"{path} is not a valid file or directory")

    def load_bytes(self, data: bytes, suffix: str, name: str = "uploaded") -> pd.DataFrame:
        return self._read(io.BytesIO(data), suffix.lower(), name)

    def _read(self, source: Union[Path, IO[bytes]], suffix: str, name: str) -> pd.DataFrame:
        try:
            if suffix == '.csv':
                df = pd.read_csv(source, delimiter=self.delimiter,
                                 index_col=self.index_col, usecols=self.usecols,
                                 encoding=self.encoding)
            elif suffix == '.xlsx':
                df = pd.read_excel(source, index_col=self.index_col,
                                   usecols=self.usecols, engine='openpyxl')
            else:
                raise ValueError(f"Unsupported file type: {suffix}")

            valid, message = DataFrameValidator.validate(df)
            if not valid:
                raise ValueError(f"[ERROR] Validation failed for {name}: {message}")

            return df
        except Exception as e:
            raise ValueError(f"[ERROR] Failed to read {name}: {e}")

