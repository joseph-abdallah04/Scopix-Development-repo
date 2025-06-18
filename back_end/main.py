from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pandas as pd
import os
import logging

# Set up logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Define expected columns for Oscillometry CSV files
EXPECTED_COLUMNS = [
    "%Pressure", "Flow_Calibrated", "Flow_Filtered", 
    "R5", "X5", "R11", "X11", "R19", "X19", "#", "Volume"
]

# Validates uploaded CSV file
def validate_csv_file(file_path: str) -> dict:
    """
    Validates structure and context of the uploaded CSV file. 
    Takes argument of file path
    Returns a dictionary {"valid": bool, "message": str}
    """
    try:
        # Step 1: Attempt to read file
        df = pd.read_csv(file_path, delimiter='\t')

        # Debug: Seeing what columns were found
        logger.info(f"DEBUG: Found {len(df.columns)} columns: {list(df.columns)}")
        logger.info(f"DEBUG: First few rows:\n{df.head(2)}")

        """
        Checking the formatting of the CSV file
        """

        # Step 2: Check if file is empty
        if df.empty:
            return {"valid": False, "message": "File is empty"}

        # Step 3: Check if there is the correct number of columns
        if len(df.columns) != len(EXPECTED_COLUMNS):
            return {"valid": False, "message": f"Expected {len(EXPECTED_COLUMNS)} columns, found {len(df.columns)}"}

        # Step 4: Check if all expected columns are present
        missing_columns = []
        for expected_col in EXPECTED_COLUMNS:
            if expected_col not in df.columns:
                missing_columns.append(expected_col)
        
        if missing_columns:
            return {"valid": False, "message": f"Missing required columns: {', '.join(missing_columns)}"}

        # Step 5: Check for extra columns that shouldn't be there
        extra_columns = []
        for col in df.columns:
            if col not in EXPECTED_COLUMNS:
                extra_columns.append(col)

        if extra_columns:
            return {"valid": False, "message": f"Unexpected columns found: {', '.join(extra_columns)}"}

        """
        Data validation checks
        """

        # Step 6: Check for empty cells
        if df.isnull().any().any():
            empty_cells = df.isnull().sum()
            problematic_columns = [col for col, count in empty_cells.items() if count > 0]
            return {"valid": False, "message": f"Empty cells found in columns: {', '.join(problematic_columns)}"}

        # Step 7: Check data types (all columns except '#' should be checked to make sure they're numeric, as # is not very relevant)
        numeric_columns = [col for col in EXPECTED_COLUMNS if col != '#']
        for col in numeric_columns:
            if not pd.to_numeric(df[col], errors='coerce').notna().all():
                return {"valid": False, "message": f"Column '{col}' contains non-numeric data"}

        # Step 8: Check row count (should be reasonable for Oscillometry data)
        row_count = len(df)
        if row_count < 1000:
            return {"valid": False, "message": f"File contains only {row_count} rows. Expected at least 1000 for valid Oscillometry data"}

        return {"valid": True, "message": f"File validation successful. {row_count} rows processed."}

    except Exception as e:
        return {"valid": False, "message": f"Error reading file: {str(e)}"}


# API Endpoint for uploading CSV files
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    # Create the /uploads directory IF it doesn't exist
    os.makedirs("uploads", exist_ok=True)

    # Save the uploaded file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Validate the CSV file
    validation_result = validate_csv_file(file_path)

    if not validation_result["valid"]:
        # Remove the invalid file
        os.remove(file_path)
        return JSONResponse(
            status_code=400,
            content={
                "error": "File validation failed",
                "message": validation_result["message"]
            }
        )

    return JSONResponse(content={
        "filename": file.filename,
        "content_type": file.content_type,
        "validation": validation_result["message"],
        "status": "success"
    })