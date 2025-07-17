import pandas as pd


def reshape_for_visualization(df: pd.DataFrame) -> pd.DataFrame:

    reshaped_rows = []

    required_columns = [
        "breath_index",
        "INSP_Volume",
        "EXP_Volume",
        "inspiration_start",
        "inspiration_end",
        "expiration_start",
        "expiration_end",
    ]

    segments = ["INSP", "EXP", "TOTAL", "MAX", "MIN", "MAX-MIN"]
    impedance_metrics = ["R5-19", "R5", "R19", "X5"]

    try:
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise KeyError(f"Missing required column(s): {missing}")

        for _, row in df.iterrows():
            breath_index = row["breath_index"]
            reshaped_rows.append(
                {
                    "breath_index": f"breath_index",
                    "segment": f"segment",
                    "R5-19": f"R5-19",
                    "R5": f"R5",
                    "R19": f"R19",
                    "X5": f"X5",
                    "INSP_Volume": f"INSP_Volume",
                    "EXP_Volume": f"EXP_Volume",
                    "inspiration_start": "inspiration_start",
                    "inspiration_end": "inspiration_end",
                    "expiration_start": "expiration_start",
                    "expiration_end": "expiration_end",
                }
            )

            for segment in ["INSP", "EXP", "TOTAL", "MAX", "MIN", "MAX-MIN"]:
                reshaped_rows.append(
                    {
                        "breath_index": breath_index,
                        "segment": segment,
                        "R5-19": row.get(f"R5-19_{segment}", None),
                        "R5": row.get(f"R5_{segment}", None),
                        "R19": row.get(f"R19_{segment}", None),
                        "X5": row.get(f"X5_{segment}", None),
                        "INSP_Volume": row["INSP_Volume"] if segment == "INSP" else None,
                        "EXP_Volume": row["EXP_Volume"] if segment == "INSP" else None,
                        "inspiration_start": (
                            row["inspiration_start"] if segment == "INSP" else None
                        ),
                        "inspiration_end": (
                            row["inspiration_end"] if segment == "INSP" else None
                        ),
                        "expiration_start": (
                            row["expiration_start"] if segment == "INSP" else None
                        ),
                        "expiration_end": (
                            row["expiration_end"] if segment == "INSP" else None
                        ),
                    }
                )

            reshaped_rows.append(
                {
                    "breath_index": None,
                    "segment": None,
                    "R5-19": None,
                    "R5": None,
                    "X5": None,
                    "R19": None,
                    "INSP_Volume": None,
                    "EXP_Volume": None,
                    "inspiration_start": None,
                    "inspiration_end": None,
                    "expiration_start": None,
                    "expiration_end": None,
                }
            )

        reshaped_df = pd.DataFrame(reshaped_rows)
        return reshaped_df.iloc[1:]

    except Exception as e:
        print(f"[ERROR] Failed to reshape for visualization: {e}")
        return pd.DataFrame()

