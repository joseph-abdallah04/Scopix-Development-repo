from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import os
import logging
# Import our validation modules
from csv_validation import validate_csv_file
from video_validation import validate_video_file

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.post("/upload-csv/")
async def upload_csv_file(file: UploadFile = File(...)):
    """Upload and validate CSV files for Oscillometry data analysis"""
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    
    # Save the uploaded file
    file_path = f"uploads/{file.filename}" # Consider inputting tempfile
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

@app.post("/upload-video/")
async def upload_video_file(file: UploadFile = File(...)):
    """
    Upload and validate video files for laryngoscopy analysis
    """

    # Create uploads directory if it doesn't exist already
    os.makedirs("uploads", exist_ok=True)

    # Save the uploaded file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Validate the video file
    validation_result = validate_video_file(file_path)

    if not validation_result["valid"]:
        # Remove the invalid file
        os.remove(file_path)
        return JSONResponse(
            status_code=400,
            content={
                "error": "Video validation failed",
                "message": validation_result["message"]
            }
        )
    
    return JSONResponse(content={
        "filename": file.filename,
        "content_type": file.content_type,
        "validation": validation_result["message"],
        "metadata": validation_result.get("metadata", {}),
        "status": "success"
    })
