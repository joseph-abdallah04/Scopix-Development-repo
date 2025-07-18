# test_gen.py

import os
import pandas as pd
from resp_modules import ImpCalc, Resp_seg, reshape_for_visualization

def process_file(filepath: str, output_dir: str, segmenter: Resp_seg, imp_calc: ImpCalc):
    basename = os.path.splitext(os.path.basename(filepath))[0]
    sub_output_dir = os.path.join(output_dir, basename)
    os.makedirs(sub_output_dir, exist_ok=True)

    try:
        sheets = pd.read_excel(filepath, sheet_name=None, index_col="#")
    except Exception as e:
        print(f"[ERROR] Failed to read {filepath}: {e}")
        return

    for sheet_name, df in sheets.items():
        df.columns = df.columns.str.strip()

        try:
            breath_segments = segmenter.seg_breaths(df)
            result_df = imp_calc.calc(df, breath_segments)

            breath_segments = breath_segments.copy()
            breath_segments["breath_index"] = breath_segments.index + 1
            merged_df = pd.merge(result_df, breath_segments, on="breath_index", how="left")
            vis_df = reshape_for_visualization(merged_df)

            output_name = f"{basename}_{sheet_name}.csv"
            save_path = os.path.join(sub_output_dir, output_name)
            vis_df.to_csv(save_path, index=False)

            print(f"[✓] {basename} - {sheet_name}, breaths: {len(breath_segments)}")
        except Exception as e:
            print(f"[ERROR] Failed {basename} - {sheet_name}: {e}")


def main():
    input_dir = "./data"
    output_dir = "./output"
    os.makedirs(output_dir, exist_ok=True)

    segmenter = Resp_seg()
    imp_calc = ImpCalc()

    for filename in os.listdir(input_dir):
        if filename.endswith(".xlsx") and not filename.startswith("~$"):
            filepath = os.path.join(input_dir, filename)
            process_file(filepath, output_dir, segmenter, imp_calc)

    print(f"\n✅ All processing completed. Results saved to: {output_dir}/")

# ✅ 仅在直接运行该脚本时执行
if __name__ == "__main__":
    main()

