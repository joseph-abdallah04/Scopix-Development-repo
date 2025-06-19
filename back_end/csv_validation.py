import pandas as pd
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Define expected columns for Oscillometry CSV files
EXPECTED_COLUMNS = [
    "%Pressure", "Flow_Calibrated", "Flow_Filtered", 
    "R5", "X5", "R11", "X11", "R19", "X19", "#", "Volume"
]

def validate_csv_file(file_path: str) -> dict:
    """
    Validates structure and context of the uploaded CSV file. 
    Takes argument of file path
    Returns a dictionary {"valid": bool, "message": str}
    """
    try:
        # Step 1: Attempt to read file with tab delimiter
        df = pd.read_csv(file_path, delimiter='\t')

        # Step 2: Check if file is empty
        if df.empty:
            return {"valid": False, "message": "File is empty"}

        # Step 3: Check if we have the correct number of columns
        if len(df.columns) != len(EXPECTED_COLUMNS):
            return {"valid": False, "message": f"Expected {len(EXPECTED_COLUMNS)} columns, found {len(df.columns)}. Columns found: {list(df.columns)}"}

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

        # Step 6: Check for empty cells
        if df.isnull().any().any():
            empty_cells = df.isnull().sum()
            problematic_columns = [col for col, count in empty_cells.items() if count > 0]
            return {"valid": False, "message": f"Empty cells found in columns: {', '.join(problematic_columns)}"}

        # Step 7: Check data types (all columns except '#' should be numeric)
        numeric_columns = [col for col in EXPECTED_COLUMNS if col != "#"]
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