import pandas as pd
import numpy as np

def BreathFeatureReshaper(df: pd.DataFrame) -> pd.DataFrame:
    # 检查字段
    required = [
        "breath_index", "INSP_Volume", "EXP_Volume",
        "inspiration_start", "inspiration_end",
        "expiration_start", "expiration_end",
    ]
    if missing := [col for col in required if col not in df.columns]:
        raise KeyError(f"Missing required column(s): {missing}")

    metrics = ["R5-19", "R5", "R19", "X5"]
    segments = ["INSP", "EXP", "INSP-EXP", "TOTAL", "MAX", "MIN", "MAX-MIN"]
    N = len(df)

    arrays = {col: df.get(col, [""] * N) for col in required}
    for m in metrics:
        for s in segments:
            arrays[f"{m}_{s}"] = df.get(f"{m}_{s}", [""] * N)

    rows = []
    for i in range(N):
        # Add blank line before each breath index (except the first one)
        if i > 0:
            blank_row = {
                "BREATH_INDEX": "",
                "SEGMENT": "",
                "R5-19": "",
                "R5": "",
                "R19": "",
                "X5": "",
                "INSP_VOLUME": "",
                "EXP_VOLUME": "",
                "INSPIRATION_START": "",
                "INSPIRATION_END": "",
                "EXPIRATION_START": "",
                "EXPIRATION_END": "",
            }
            rows.append(blank_row)
        
        # Add header line for the breath index
        # header_row = {
        #     "BREATH_INDEX": f"Breath {arrays['breath_index'][i]}",
        #     "SEGMENT": "SEGMENT",
        #     "R5-19": "R5-19",
        #     "R5": "R5",
        #     "R19": "R19",
        #     "X5": "X5",
        #     "INSP_VOLUME": "INSP_VOLUME",
        #     "EXP_VOLUME": "EXP_VOLUME",
        #     "INSPIRATION_START": "INSPIRATION_START",
        #     "INSPIRATION_END": "INSPIRATION_END",
        #     "EXPIRATION_START": "EXPIRATION_START",
        #     "EXPIRATION_END": "EXPIRATION_END",
        # }
        # rows.append(header_row)
        
        # Add data rows for each segment
        for seg in segments:
            row = {
                "BREATH_INDEX": arrays["breath_index"][i],
                "SEGMENT": seg,
                "R5-19": arrays[f"R5-19_{seg}"][i],
                "R5": arrays[f"R5_{seg}"][i],
                "R19": arrays[f"R19_{seg}"][i],
                "X5": arrays[f"X5_{seg}"][i],
                "INSP_VOLUME": arrays["INSP_Volume"][i] if seg == "INSP" else "",
                "EXP_VOLUME": arrays["EXP_Volume"][i] if seg == "INSP" else "",
                "INSPIRATION_START": arrays["inspiration_start"][i] if seg == "INSP" else "",
                "INSPIRATION_END": arrays["inspiration_end"][i] if seg == "INSP" else "",
                "EXPIRATION_START": arrays["expiration_start"][i] if seg == "INSP" else "",
                "EXPIRATION_END": arrays["expiration_end"][i] if seg == "INSP" else "",
            }
            rows.append(row)

    return pd.DataFrame(rows)

