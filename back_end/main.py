from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Form, Request
from fastapi.responses import JSONResponse, Response, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import tempfile
import logging
import uuid
import os
import shutil
from typing import Dict, Optional, List, Any
from datetime import datetime
# Import our validation modules
from Resp_Analysis.resp_modules.csv_validation import validate_csv_bytes
from api.plotter_api import router as plotter_api 
from api.upload_and_downland_api import router as upload_and_downland_api
from api.export_api import router as export_api
from video_validation import validate_video_file
# Import other logic
from frame_capture import capture_frame
from session_manager import session_manager
from measurement_engine import calculate_angle, calculate_area_opencv, calculate_area_scikit, calculate_area_comparison, calculate_distance_ratio
from video_export_engine import create_excel_export
from pydantic import BaseModel
import json
import io


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(plotter_api)
app.include_router(upload_and_downland_api)
app.include_router(export_api)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",  # Add this if your frontend runs on 5174
        "http://0.0.0.0:5173",
        "http://0.0.0.0:5174",    # Add this if needed
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",  # Add this if needed
        "http://192.168.65.1:5173", # Joseph's docker container host IP
        "http://192.168.65.1:5174", # Add this for port 5174
    ], # The Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Directory to store videos - Creates directory if it doesn't already exist
VIDEO_STORAGE_DIR = "/tmp/current_video"
os.makedirs(VIDEO_STORAGE_DIR, exist_ok=True)

class PointsRequest(BaseModel):
    points: List[List[float]]  # List of [x, y] pairs

class AngleResponse(BaseModel):
    angle: float

class MultipleAnglesRequest(BaseModel):
    measurements: List[Dict[str, Any]]  # List of angle measurements
    # Each measurement should have: {"type": "glottic|supraglottic", "points": [[x1,y1], [x2,y2], [x3,y3]]}

class MultipleAnglesResponse(BaseModel):
    measurements: List[Dict[str, Any]]  # List of calculated angles with metadata
    # Each response: {"type": "glottic|supraglottic", "angle": float, "points": [...]}

class AreaRequest(BaseModel):
    points: List[List[float]]
    method: Optional[str] = "scikit"  # "opencv", "scikit", or "comparison"
    scale_pixels_per_mm: Optional[float] = None

class AreaResponse(BaseModel):
    area_pixels: float
    perimeter_pixels: float
    method: str
    point_count: int
    area_mm2: Optional[float] = None
    perimeter_mm: Optional[float] = None
    scale_pixels_per_mm: Optional[float] = None
    centroid: Optional[List[float]] = None
    bbox: Optional[List[float]] = None
    eccentricity: Optional[float] = None
    solidity: Optional[float] = None

class AreaComparisonResponse(BaseModel):
    opencv_contour: Optional[Dict[str, Any]] = None
    opencv_shoelace: Optional[Dict[str, Any]] = None
    scikit_image: Optional[Dict[str, Any]] = None
    comparison: Optional[Dict[str, Any]] = None

class DistanceRatioRequest(BaseModel):
    horizontal_points: List[List[float]]
    vertical_points: List[List[float]]

class DistanceRatioResponse(BaseModel):
    horizontal_distance: float
    vertical_distance: float
    ratio_percentage: float
    horizontal_points: List[List[float]]
    vertical_points: List[List[float]]


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
        validation_result = validate_csv_bytes(temp_file.name)
        
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


@app.get("/session/current")
async def get_current_session():
    """
    Get current active session info
    """

    session = session_manager.get_current_session()
    if not session:
        return JSONResponse(
            status_code=404,
            content={"error": "No active session"}
        )

    return JSONResponse(content={
        "session_id": session["session_id"],
        "filename": session["filename"],
        "metadata": session["metadata"],
        "measured_frames_count": len(session["measured_frames"]),
        "video_path": session["video_path"], # For internal use
        "current_timestamp": session.get("current_timestamp", 0.0),
        "current_frame_idx": session.get("current_frame_idx", 0),
        "is_paused": session.get("is_paused", True)
    })


@app.get("/session/video-stream")
async def stream_session_video():
    """
    Stream video file from current session - Electron optimized
    """
    session = session_manager.get_current_session()
    if not session:
        return JSONResponse(
            status_code=404,
            content={"error": "Video file not found"}
        )

    video_path = session["video_path"]
    
    if not os.path.exists(video_path):
        return JSONResponse(
            status_code=404,
            content={"error": "Video file not found on disk"}
        )

    try:
        # Simple file streaming - no caching headers needed in Electron
        with open(video_path, "rb") as video_file:
            video_content = video_file.read()
        
        return Response(
            content=video_content,
            media_type="video/mp4",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(len(video_content))
            }
        )
    except Exception as e:
        logger.error(f"Error streaming video: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to stream video"}
        )


@app.post("/session/clear")
async def clear_session():
    """
    Clear current session and cleanup files
    """
    try:
        session_manager.clear_current_session()
        return JSONResponse(content={"message": "Session cleared successfully"})
    except Exception as e:
        logger.error(f"Error clearing session: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to clear session"}
        )


@app.post("/session/save-measurement")
async def save_measurement(measurement_data: dict):
    """
    Save measurement data to current session
    """
    try:
        frame_id = session_manager.add_measured_frame(measurement_data)
        return JSONResponse(content={
            "message": "Measurement saved successfully",
            "frame_id": frame_id
        })
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
    except Exception as e:
        logger.error(f"Error saving measurement: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to save measurement"}
        )


@app.post("/session/update-position")
async def update_session_position(
    timestamp: float = Query(..., description="Current timestamp in seconds"),
    frame_idx: int = Query(..., description="Current frame index"),
    is_paused: bool = Query(None, description="Whether video is paused")
):
    """
    Update the current video position in the session
    """
    try:
        session_manager.update_current_position(timestamp, frame_idx, is_paused)
        return JSONResponse(content={"message": "Position updated successfully"})
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
    except Exception as e:
        logger.error(f"Error updating position: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to updated position"}
        )


@app.post("/measure/angle", response_model=AngleResponse)
def measure_angle(request: PointsRequest):
    try:
        angle = calculate_angle(request.points)
        return AngleResponse(angle=angle)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/measure/multiple-angles", response_model=MultipleAnglesResponse)
def measure_multiple_angles(request: MultipleAnglesRequest):
    try:
        results = []
        for measurement in request.measurements:
            angle_type = measurement.get("type", "unknown")
            points = measurement.get("points", [])
            
            if len(points) != 3:
                raise ValueError(f"Each angle measurement must have exactly 3 points, got {len(points)}")
            
            angle = calculate_angle(points)
            results.append({
                "type": angle_type,
                "angle": angle,
                "points": points
            })
        
        return MultipleAnglesResponse(measurements=results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/measure/area", response_model=AreaResponse)
def measure_area(request: AreaRequest):
    """
    Calculate area using specified method
    """
    try:
        if request.method == "opencv":
            result = calculate_area_opencv(request.points, "contour")
        elif request.method == "scikit":
            result = calculate_area_scikit(request.points)
        elif request.method == "comparison":
            comparison_result = calculate_area_comparison(request.points, request.scale_pixels_per_mm)
            # Return the recommended method (scikit-image) from comparison
            if "scikit_image" in comparison_result and "error" not in comparison_result["scikit_image"]:
                result = comparison_result["scikit_image"]
            elif "opencv_contour" in comparison_result and "error" not in comparison_result["opencv_contour"]:
                result = comparison_result["opencv_contour"]
            else:
                raise ValueError("All measurement methods failed")
        else:
            raise ValueError(f"Unknown method: {request.method}")
        
        # Add calibrated measurements if scale provided
        if request.scale_pixels_per_mm and "area_pixels" in result:
            result["area_mm2"] = result["area_pixels"] / (request.scale_pixels_per_mm ** 2)
            result["perimeter_mm"] = result["perimeter_pixels"] / request.scale_pixels_per_mm
            result["scale_pixels_per_mm"] = request.scale_pixels_per_mm
        
        return AreaResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/measure/area-comparison", response_model=AreaComparisonResponse)
def measure_area_comparison_endpoint(request: AreaRequest):
    """
    Calculate area using multiple methods for comparison
    """
    try:
        result = calculate_area_comparison(request.points, request.scale_pixels_per_mm)
        return AreaComparisonResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/session/check-frame/{frame_idx}")
async def check_frame_exists(frame_idx: int):
    """Check if a frame has already been measured"""
    try:
        existing_frame = session_manager.check_frame_exists(frame_idx)
        if existing_frame:
            return JSONResponse(content={
                "exists": True,
                "frame_data": {
                    "frame_id": existing_frame["frame_id"],
                    "custom_name": existing_frame.get("custom_name"),
                    "timestamp": existing_frame["timestamp"]
                }
            })
        else:
            return JSONResponse(content={"exists": False})
    except Exception as e:
        logger.error(f"Error checking frame existence: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to check frame"})


@app.post("/session/update-frame-name")
async def update_frame_name(request: Request):
    """Update the custom name of a measured frame"""
    try:
        data = await request.json()
        frame_id = data.get("frame_id")
        custom_name = data.get("custom_name")
        
        if not frame_id or custom_name is None:
            return JSONResponse(
                status_code=400,
                content={"error": "frame_id and custom_name are required"}
            )
        
        success = session_manager.update_frame_custom_name(frame_id, custom_name)
        if success:
            return JSONResponse(content={"message": "Frame name updated successfully"})
        else:
            return JSONResponse(
                status_code=404,
                content={"error": "Frame not found"}
            )
    except Exception as e:
        logger.error(f"Error updating frame name: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to update frame name"}
        )


@app.delete("/session/remove-frame/{frame_id}")
async def remove_measured_frame(frame_id: str):
    """Remove a measured frame from the session"""
    try:
        success = session_manager.remove_measured_frame(frame_id)
        if success:
            return JSONResponse(content={"message": "Frame removed successfully"})
        else:
            return JSONResponse(
                status_code=404,
                content={"error": "Frame not found"}
            )
    except Exception as e:
        logger.error(f"Error removing frame: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to remove frame"}
        )


@app.post("/session/save-measured-frame")
async def save_measured_frame(request: Request):
    """Save a measured frame with all its data"""
    try:
        # Get JSON data from request body
        data = await request.json()
        
        timestamp = data.get("timestamp")
        frame_idx = data.get("frame_idx")
        measurements = data.get("measurements", {})
        custom_name = data.get("custom_name")  # Add custom_name support
        override_existing = data.get("override_existing", False)  # Flag for overriding
        
        if timestamp is None or frame_idx is None:
            return JSONResponse(
                status_code=400, 
                content={"error": "timestamp and frame_idx are required"}
            )

        # Check if frame already exists and handle override
        existing_frame = session_manager.check_frame_exists(frame_idx)
        if existing_frame and not override_existing:
            return JSONResponse(
                status_code=409,  # Conflict status code
                content={
                    "error": "Frame already exists",
                    "existing_frame": {
                        "frame_id": existing_frame["frame_id"],
                        "custom_name": existing_frame.get("custom_name"),
                        "timestamp": existing_frame["timestamp"]
                    }
                }
            )
        
        # If overriding, remove the existing frame first
        if existing_frame and override_existing:
            session_manager.remove_measured_frame(existing_frame["frame_id"])
        
        # Capture frame thumbnail
        session = session_manager.get_current_session()
        if not session:
            return JSONResponse(status_code=400, content={"error": "No active session"})
        
        # Capture frame as thumbnail
        thumbnail_bytes = capture_frame(
            file_path=session["video_path"],
            timestamp=timestamp,
            frame_idx=frame_idx
        )
        
        # Save thumbnail to temp file
        thumbnail_filename = f"frame_{frame_idx}_{timestamp:.3f}.jpg"
        thumbnail_path = os.path.join(session_manager.session_temp_dir, thumbnail_filename)
        
        with open(thumbnail_path, "wb") as f:
            f.write(thumbnail_bytes)
        
        # Prepare frame data
        frame_data = {
            "timestamp": timestamp,
            "frame_idx": frame_idx,
            "measurements": measurements,
            "custom_name": custom_name,  # Include custom_name
            "thumbnail_path": thumbnail_path
        }
        
        frame_id = session_manager.add_measured_frame(frame_data)
        
        return JSONResponse(content={
            "message": "Frame saved successfully",
            "frame_id": frame_id
        })
        
    except Exception as e:
        logger.error(f"Error saving measured frame: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to save measured frame"}
        )


@app.post("/session/set-baseline/{frame_id}")
async def set_baseline_frame(frame_id: str):
    """set which frame is the baseline"""
    try:
        session_manager.set_baseline_frame(frame_id)
        return JSONResponse(content={"message": "Baseline frame set successfully"})
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        logger.error(f"Error setting baseline: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to set baseline"})


@app.get("/session/measured-frames")
async def get_measured_frames():
    """Get all measured frames"""
    try:
        session = session_manager.get_current_session()
        if not session:
            return JSONResponse(status_code=400, content={"error": "No active session"})
        
        return JSONResponse(content={
            "measured_frames": session["measured_frames"],
            "baseline_frame_id": session.get("baseline_frame_id")
        })
    except Exception as e:
        logger.error(f"Error getting measured frames: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to get measured frames"})


@app.get("/session/frame-thumbnail/{frame_id}")
async def get_frame_thumbnail(frame_id: str):
    """Get thumbnail for a specific measured frame"""
    try:
        thumbnail_bytes = session_manager.get_frame_thumbnail(frame_id)
        return Response(content=thumbnail_bytes, media_type="image/jpeg")
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        logger.error(f"Error getting frame thumbnail: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to get frame thumbnail"})


@app.post("/session/save-canvas-frame")
async def save_canvas_captured_frame(request: Request):
    """
    Save a frame that was captured using canvas (frontend) with exact timing
    This ensures perfect synchronization between frontend display and backend storage
    """
    try:
        form = await request.form()
        
        # Get frame metadata
        timestamp = float(form.get("timestamp"))
        frame_idx = int(form.get("frame_idx"))
        measurements = json.loads(form.get("measurements", "{}"))
        custom_name = form.get("custom_name")
        override_existing = form.get("override_existing", "false").lower() == "true"
        
        # Get the canvas-captured image
        canvas_image = form.get("canvas_image")
        
        if not canvas_image or not hasattr(canvas_image, 'read'):
            return JSONResponse(
                status_code=400,
                content={"error": "Canvas image is required"}
            )
        
        print(f"🎯 Saving canvas-captured frame: time={timestamp}, frame={frame_idx}")
        
        # Check if frame already exists
        existing_frame = session_manager.check_frame_exists(frame_idx)
        if existing_frame and not override_existing:
            return JSONResponse(
                status_code=409,
                content={
                    "error": "Frame already exists",
                    "existing_frame": {
                        "frame_id": existing_frame["frame_id"],
                        "custom_name": existing_frame.get("custom_name"),
                        "timestamp": existing_frame["timestamp"]
                    }
                }
            )
        
        # Remove existing frame if overriding
        if existing_frame and override_existing:
            session_manager.remove_measured_frame(existing_frame["frame_id"])
        
        # Get current session
        session = session_manager.get_current_session()
        if not session:
            return JSONResponse(status_code=400, content={"error": "No active session"})
        
        # Save the canvas image as thumbnail
        canvas_image_bytes = await canvas_image.read()
        
        # Save thumbnail to temp file
        thumbnail_filename = f"canvas_frame_{frame_idx}_{timestamp:.3f}.png"
        thumbnail_path = os.path.join(session_manager.session_temp_dir, thumbnail_filename)
        
        with open(thumbnail_path, "wb") as f:
            f.write(canvas_image_bytes)
        
        # Prepare frame data with exact timing
        frame_data = {
            "timestamp": timestamp,
            "frame_idx": frame_idx,
            "measurements": measurements,
            "custom_name": custom_name,
            "thumbnail_path": thumbnail_path,
            "capture_method": "canvas"  # Track that this was canvas-captured
        }
        
        frame_id = session_manager.add_measured_frame(frame_data)
        
        print(f"✅ Canvas frame saved successfully with ID: {frame_id}")
        
        return JSONResponse(content={
            "message": "Canvas frame saved successfully",
            "frame_id": frame_id,
            "capture_method": "canvas"
        })
        
    except Exception as e:
        logger.error(f"Error saving canvas frame: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to save canvas frame"}
        )


@app.get("/session/video-info")
async def get_current_video_info():
    """Get detailed information about the current session's video"""
    try:
        session = session_manager.get_current_session()
        if not session:
            return JSONResponse(status_code=400, content={"error": "No active video session"})
        
        import cv2
        cap = cv2.VideoCapture(session["video_path"])
        
        if not cap.isOpened():
            return JSONResponse(status_code=400, content={"error": "Cannot open video file"})
        
        try:
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            video_info = {
                "fps": fps,
                "frame_count": frame_count,
                "duration": duration,
                "width": width,
                "height": height
            }
            
            return JSONResponse(content={"video_info": video_info})
        finally:
            cap.release()
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})



@app.delete("/session/remove-measured-frame/{frame_id}")
async def delete_measured_frame(frame_id: str):
    """Delete a measured frame by its ID"""
    try:
        success = session_manager.remove_measured_frame(frame_id)
        if success:
            return JSONResponse(content={"message": "Frame removed successfully"})
        else:
            return JSONResponse(
                status_code=404,
                content={"error": "Frame not found"}
            )
    except Exception as e:
        logger.error(f"Error removing measured frame: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to remove measured frame"}
        )


@app.get("/session/video-file")
async def get_session_video_file():
    """
    Serve video file directly for frontend loading (not streaming)
    """
    session = session_manager.get_current_session()
    if not session:
        return JSONResponse(
            status_code=404,
            content={"error": "Video file not found"}
        )

    video_path = session["video_path"]
    
    if not os.path.exists(video_path):
        return JSONResponse(
            status_code=404,
            content={"error": "Video file not found on disk"}
        )

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename="video.mp4"
    )


@app.post("/measure/distance-ratio", response_model=DistanceRatioResponse)
def measure_distance_ratio(request: DistanceRatioRequest):
    """
    Calculate distance ratio (horizontal/vertical) * 100
    """
    try:
        result = calculate_distance_ratio(request.horizontal_points, request.vertical_points)
        return DistanceRatioResponse(**result)
    except Exception as e:
        logger.error(f"Distance ratio calculation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/session/export-results")
async def export_results_with_calculated_data(request: Request):
    """Export analysis results using pre-calculated percentage data from frontend"""
    try:
        data = await request.json()
        frames_data = data.get("frames_data", [])
        baseline_frame_id = data.get("baseline_frame_id")
        export_timestamp = data.get("export_timestamp")
        
        if not frames_data:
            raise HTTPException(status_code=400, detail="No frames data provided")
        
        # Prepare export metadata
        export_metadata = {
            "export_timestamp": export_timestamp,
            "total_frames": len(frames_data),
            "baseline_frame_id": baseline_frame_id
        }
        
        # Use the export engine to create Excel file - PASS SESSION MANAGER
        excel_buffer = create_excel_export(
            frames_data=frames_data,
            baseline_frame_id=baseline_frame_id,
            export_metadata=export_metadata,
            session_manager=session_manager  # Add this line
        )
        
        # Generate filename
        filename = f"video_analysis_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(excel_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
