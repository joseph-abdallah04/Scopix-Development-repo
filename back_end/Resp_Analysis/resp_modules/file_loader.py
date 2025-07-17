from dataclasses import dataclass, field
from pathlib import Path
from typing import Union, Dict, Optional, List
import pandas as pd
import io

@dataclass
class CSVLoader:
    delimiter: str = '\t'
    suffix: str = '.csv'
    index_col: Optional[str] = '#'
    usecols: Optional[List[str]] = field(default=None)
    encoding: str = "utf-8"

    
    def _read_csv(self, filepath: Path) -> pd.DataFrame:
        try:
            df = pd.read_csv(
                filepath, 
                delimiter=self.delimiter, 
                index_col=self.index_col,
                usecols=self.usecols,
                encoding=self.encoding
            )
            if df.isnull().values.any():
                raise ValueError(f"[ERROR] Missing values detected in {filepath.name}")
            return df
            
        except Exception as e:
            raise ValueError(f"[ERROR] Failed to load {filepath.name}: {e}")
            
            
    def _read_bytes(self, data: bytes) -> pd.DataFrame:
        try:
            df = pd.read_csv(
                io.BytesIO(data),
                delimiter=self.delimiter,
                index_col=self.index_col,
                usecols=self.usecols,
                encoding=self.encoding
            )
            if df.isnull().values.any():
                raise ValueError("[ERROR] Missing values detected in uploaded data")
            return df
        except Exception as e:
            raise ValueError(f"[ERROR] Failed to read uploaded CSV bytes: {e}")

            
    def load(self, path: Union[str, Path]) -> Dict[str, pd.DataFrame]:
        path_obj = Path(path)

        if path_obj.is_file():
            try:
                df = self._read_csv(path_obj)
                return {path_obj.stem: df}
            except Exception as e:
                raise ValueError(f"[ERROR] Failed to load file {path_obj}: {e}")

        elif path_obj.is_dir():
            result = {}
            for f in path_obj.glob(f"*{self.suffix}"):
                if f.is_file():
                    try:
                        df = self._read_bytes(f)
                        result[f.stem] = df
                    except Exception as e:
                        print(f"[WARN] Skipping {f.name}: {e}")
            return result

        else:
            raise FileNotFoundError(f"{path} is not a valid file or directory")

