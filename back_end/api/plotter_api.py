from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse

import json
import pandas as pd
import io
import os
from Resp_Analysis.resp_modules.export_utils import ExportUtils
from Resp_Analysis.resp_modules.dataframe_loader import DataFrameLoader

router = APIRouter()

@router.post("/plot-csv")
async def plot_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # Use DataFrameLoader for consistent file handling
        loader = DataFrameLoader(index_col='#')
        df = loader.load_bytes(contents, os.path.splitext(file.filename.lower())[1], file.filename)

        required_cols = {"X5", "R5", "Volume"}
        if not required_cols.issubset(df.columns):
            return JSONResponse(
                status_code=400,
                content={"error": f"Missing required columns: {required_cols - set(df.columns)}"}
            )

        json_str = ExportUtils.dataframe_to_plot_json(df, columns=["X5", "R5", "Volume"])
        return StreamingResponse(json_str, media_type="application/json")


    except Exception as e:
        print(f"[ERROR] /plot-csv failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

