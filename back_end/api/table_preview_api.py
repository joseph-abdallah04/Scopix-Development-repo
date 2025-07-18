# routers/preview_table.py
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import os
import json

router = APIRouter()

@router.get("/table_preview")
async def preview_table(preview_path: str = Query(..., description="Path to the computed JSON result")):
    """
    Reads a JSON file from disk and returns the full table data (for display purposes)
    """
    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="File not found. Please upload and compute first.")

    try:
        with open(preview_path, "r", encoding="utf-8") as f:
            records = json.load(f)

        df = pd.DataFrame(records)
        return {
            "items": df.to_dict(orient="records")
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


