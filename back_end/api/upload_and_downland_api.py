from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tempfile, shutil, os
import pandas as pd
from Resp_Analysis.main_proc import process_file
from . import export_api
router = APIRouter()

def clean_records(records: pd.DataFrame, key_fields: list[str]) -> list[dict]:
    if not records:
        return []

    df = pd.DataFrame(records)

    df = df.dropna(how="all")
    df = df.loc[~df.apply(lambda row: all(str(v).strip() == "" for v in row), axis=1)]


    header = list(df.columns)
    is_header_like = df.apply(
        lambda row: all(str(row[k]).strip().lower() == k.lower() for k in header),
        axis=1
    )
    df = df[~is_header_like]

    return df.to_dict(orient="records")


@router.post("/upload-download/")
async def upload_and_download(file: UploadFile = File(...)):
    global last_processed_result
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

        basename, vis_df, df = process_file(file_path)
        export_api.last_processed_result = (basename, df, vis_df)
        records = vis_df.to_dict(orient="records")

        key_fields = [
            "breath_index", "segment", "R5-19", "R5", "R19", "X5",
            "INSP_Volume", "EXP_Volume", 
            "inspiration_start", "inspiration_end", 
            "expiration_start", "expiration_end"
        ]
        cleaned_records = clean_records(records, key_fields)

        return JSONResponse(content={
            "filename": f"{basename}_result",
            "items": cleaned_records
        })

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

