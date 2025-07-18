from .resp_modules import (
    ImpCalc, Resp_seg, reshape_for_visualization, CSVLoader,
    plot_r5_x5_volume, dataframe_bytesio, dataframe_and_image_to_pdf,
    write_zip_from_bytesio
)
from io import BytesIO
import os, json, tempfile
from typing import List, Tuple
import pandas as pd

def process_file(filepath: str) -> Tuple[str, List[dict]]:
    basename = os.path.splitext(os.path.basename(filepath))[0]

    try:
        loader = CSVLoader(index_col="#", delimiter="\t")
        df = next(iter(loader.load(filepath).values()))
        df.columns = df.columns.str.strip()
    except Exception as e:
        raise RuntimeError(f"[ERROR] Failed to load {basename}: {e}") from e

    try:
        segmenter = Resp_seg()
        imp_calc = ImpCalc()

        breath_segments = segmenter.seg_breaths(df)
        result_df = imp_calc.calc(df, breath_segments)

        breath_segments["breath_index"] = breath_segments.index + 1
        merged_df = pd.merge(result_df, breath_segments, on="breath_index", how="left")
        vis_df = reshape_for_visualization(merged_df)

        print(f"[✓] {basename}, breaths: {len(breath_segments)}")
        
        return basename, vis_df, df

    except Exception as e:
        raise RuntimeError(f"[ERROR] Failed to process {basename}: {e}") from e

def generate_report_files(df: pd.DataFrame, vis_df: pd.DataFrame) -> BytesIO:
    csv_buf = dataframe_bytesio(vis_df)
    img_buf = plot_r5_x5_volume(df)
    pdf_buf = dataframe_and_image_to_pdf(
        vis_df, img_buf,
        columns=["breath_index", "segment", "R5-19", "R5", "R19", "X5", "INSP_Volume", "EXP_Volume"]
    )

    zip_buf = write_zip_from_bytesio({
        "report.pdf": pdf_buf,
        "data.csv": csv_buf,
        "plot.png": img_buf
    })

    return zip_buf

