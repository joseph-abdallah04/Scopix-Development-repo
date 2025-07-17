from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import logging
import uuid
import os
import shutil
from typing import Dict, Optional
# Import our validation modules
# from video_validation import validate_video_file
# Import other logic
# from frame_capture import capture_frame
# from session_manager import session_manager

from api.plotter_api import router as plotter_api
from api.upload_and_downland_api import router as upload_and_downland_api
from fastapi.middleware.gzip import GZipMiddleware

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(plotter_api)
app.include_router(upload_and_downland_api)

'''
# Directory to store videos - Creates directory if it doesn't already exist
VIDEO_STORAGE_DIR = "/tmp/current_video"
os.makedirs(VIDEO_STORAGE_DIR, exist_ok=True)




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
'''

'''
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
        
        # Save video for analysis session (temporary but accessible)
        video_filename = f"analysis_video_{uuid.uuid4()}.mp4"
        video_path = os.path.join(VIDEO_STORAGE_DIR, video_filename)
        shutil.copy2(temp_file.name, video_path)

        # Extract video metadata using the validation result
        metadata = validation_result.get("metadata", {})

        # Create new session (automatically clears any existing session)
        session_id = session_manager.create_session(
            video_path=video_path,
            filename=file.filename,
            metadata=metadata
        )
        
        return JSONResponse(content={
            "filename": file.filename,
            "content_type": file.content_type,
            "validation": validation_result["message"],
            "metadata": validation_result.get("metadata", {}),
            "status": "success"
        })
    # Temp file is automatically deleted when exiting the context manager

@app.get("/frame-capture/")
async def get_video_frame(
    frame_idx: int = Query(None, description="Frame index to extract"),
    timestamp: float = Query(None, description="Timestamp (in seconds) to extract")
):
    """
    Extract a frame from the current session's video by frame index or timestamp.
    Returns the frame as a JPEG image
    """

    # Get current session
    session = session_manager.get_current_session()
    if not session:
        return JSONResponse(
            status_code=400,
            content={"error": "No active video session"}
        )
    
    try:
        jpeg_bytes = capture_frame(
            file_path=session["video_path"],
            frame_idx=frame_idx,
            timestamp=timestamp
        )
        return Response(content=jpeg_bytes, media_type="image/jpeg")
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
        
'''
