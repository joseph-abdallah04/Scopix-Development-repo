# Resp_Analysis/resp_modules/extract_to_json.py

import pandas as pd
import numpy as np
import orjson
from multiprocessing import Pool, cpu_count
from typing import List, Tuple

def _process_column_orjson(args: Tuple[str, np.ndarray, np.ndarray]) -> bytes:
    col, time_axis, values = args

    arr = np.stack((time_axis, values), axis=1)

    return orjson.dumps({
        "id": col,
        "data": [{"x": x, "y": y} for x, y in arr.tolist()]
    })


def csv_plot_json(
    data: pd.DataFrame,
    columns: List[str],
    sample_rate: float = 200.0
):
    index = data.index.to_numpy()
    try:
        time_axis = index.astype(np.float32) / sample_rate
    except Exception:
        raise ValueError("Index must be numeric")

    tasks = []
    for col in columns:
        if col not in data.columns:
            raise ValueError(f"Column '{col}' not in CSV")
        values = data[col].to_numpy(dtype=np.float32)
        tasks.append((col, time_axis, values))

    with Pool(processes=min(cpu_count(), len(columns))) as pool:
        yield b'['
        for i, json_bytes in enumerate(pool.imap(_process_column_orjson, tasks)):
            if i > 0:
                yield b','
            yield json_bytes
        yield b']'

