from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import tempfile
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
    
    # Use tempfile for secure temporary file handling
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
        # Save the uploaded file content to temp file
        content = await file.read()
        temp_file.write(content)
        temp_file.flush()  # Ensure content is written to disk
        
        # Validate the CSV file
        validation_result = validate_csv_file(temp_file.name)
        
        if not validation_result["valid"]:
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
    # Temp file is automatically deleted when exiting the context manager

@app.post("/upload-video/")
async def upload_video_file(file: UploadFile = File(...)):
    """
    Upload and validate video files for laryngoscopy analysis
    """
    
    # Use tempfile for secure temporary file handling
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        # Save the uploaded file content to temp file
        content = await file.read()
        temp_file.write(content)
        temp_file.flush()  # Ensure content is written to disk
        
        # Validate the video file
        validation_result = validate_video_file(temp_file.name)
        
        if not validation_result["valid"]:
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
    # Temp file is automatically deleted when exiting the context manager
