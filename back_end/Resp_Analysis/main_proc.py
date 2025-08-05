from .resp_modules import (
    ImpedanceFeatureExtractor, BreathSegmenter, BreathFeatureReshaper, DataFrameLoader,
    RespiratoryPlotter, ExportUtils
)
from io import BytesIO
import os
import pandas as pd
from typing import Tuple


def process_file(filepath: str) -> Tuple[str, pd.DataFrame, pd.DataFrame]:
    """
    加载并处理一个呼吸数据文件，返回：文件名、可视化 DataFrame、原始 DataFrame。
    """
    name = os.path.splitext(os.path.basename(filepath))[0]
    df = _load_df(filepath, name)

    segmenter = BreathSegmenter()
    extractor = ImpedanceFeatureExtractor()

    breaths = segmenter.segment(df)
    results = extractor.calc(df, breaths)

    breaths["breath_index"] = breaths.index + 1
    merged = pd.merge(results, breaths, on="breath_index", how="left")
    vis_df = BreathFeatureReshaper(merged)

    print(f"{name}, breaths: {len(breaths)}")
    return name, vis_df, df, breaths


def generate_report_files(df: pd.DataFrame, vis_df: pd.DataFrame) -> BytesIO:
    """
    根据分析结果生成包含 CSV、PDF 和图像的压缩包。
    """
    return ExportUtils.write_zip({
        "data.csv": ExportUtils.dataframe_to_csv_bytes(vis_df),
        "plot.png": RespiratoryPlotter(df),
        "report.pdf": ExportUtils.dataframe_and_image_to_pdf(
            vis_df,
            image_bytes=RespiratoryPlotter(df),
        columns = [
            "BREATH_INDEX", "SEGMENT", "R5-19", "R5", "R19", "X5",
            "INSP_VOLUME", "EXP_VOLUME"
        ],
        )
    })


def _load_df(path: str, name: str) -> pd.DataFrame:
    """
    加载 DataFrame，自动修剪列名。
    """
    try:
        df = next(iter(DataFrameLoader(index_col="#", delimiter="\t").load(path).values()))
        df.columns = df.columns.str.strip()
        return df
    except Exception as e:
        raise RuntimeError(f"[ERROR] Failed to load {name}: {e}") from e

