import cv2
import os
import logging

# Set up logging  
logger = logging.getLogger(__name__)

# Video validation constants - backend detailed validation only
MAX_DURATION_SECONDS = 15 * 60  # 15 minutes
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024  # 2GB

def validate_video_file(file_path: str) -> dict:
    """
    Validates detailed video content and metadata.
    Assumes basic file format validation (.mp4) already done on frontend.
    
    Args:
        file_path: Path to the video file to validate
        
    Returns:
        dict: {"valid": bool, "message": str, "metadata": dict}
    """
    try:
        # Step 1: Check file size (backend validation for large files)
        file_size = os.path.getsize(file_path)
        if file_size > MAX_FILE_SIZE_BYTES:
            size_gb = file_size / (1024 * 1024 * 1024)
            max_size_gb = MAX_FILE_SIZE_BYTES / (1024 * 1024 * 1024)
            return {"valid": False, "message": f"File size {size_gb:.1f}GB exceeds maximum allowed size of {max_size_gb:.1f}GB"}

        # Step 2: Try to open with OpenCV
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return {"valid": False, "message": "Cannot open video file. File may be corrupted or in unsupported format"}

        # Step 3: Extract metadata
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration_seconds = frame_count / fps if fps > 0 else 0

        cap.release()

        # Step 4: Validate video properties
        if frame_count == 0:
            return {"valid": False, "message": "Video contains no frames"}

        if fps <= 0:
            return {"valid": False, "message": "Invalid frame rate detected"}

        if duration_seconds > MAX_DURATION_SECONDS:
            max_duration_minutes = MAX_DURATION_SECONDS / 60
            actual_duration_minutes = duration_seconds / 60
            return {"valid": False, "message": f"Video duration {actual_duration_minutes:.1f} minutes exceeds maximum allowed duration of {max_duration_minutes:.1f} minutes"}

        if width <= 0 or height <= 0:
            return {"valid": False, "message": "Invalid video dimensions"}

        # Step 5: Verify we can read at least the first frame
        cap = cv2.VideoCapture(file_path)
        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            return {"valid": False, "message": "Cannot read video frames. File may be corrupted"}

        # Success - return metadata
        metadata = {
            "duration_seconds": round(duration_seconds, 2),
            "duration_minutes": round(duration_seconds / 60, 2),
            "fps": round(fps, 2),
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "file_size_gb": round(file_size / (1024 * 1024 * 1024), 3)
        }

        return {
            "valid": True, 
            "message": f"Video validation successful. Duration: {duration_seconds/60:.1f} min, {width}x{height}, {fps:.1f} FPS",
            "metadata": metadata
        }

    except Exception as e:
        return {"valid": False, "message": f"Error validating video: {str(e)}"}