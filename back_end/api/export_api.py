from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import json
import tempfile, shutil, os
from Resp_Analysis.main_proc import process_file, generate_report_files

router = APIRouter()
last_processed_result: tuple[str, pd.DataFrame, pd.DataFrame] | None = None

@router.get("/export-zip/")
async def export_zip():
    global last_processed_result

    if not last_processed_result:
        raise HTTPException(status_code=400, detail="No processed result available.")

    basename, df, vis_df = last_processed_result

    try:
        zip_buf = generate_report_files(df, vis_df)

        return StreamingResponse(
            zip_buf,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={basename}_report.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")

