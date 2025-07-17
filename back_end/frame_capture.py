import cv2
import os
import numpy as np
import logging

# Set up logging
logger = logging.getLogger(__name__)

def capture_frame(file_path: str, timestamp: float = None, frame_idx: int = None) -> bytes:
    """
    Extract a frame from a video file at a given timestamp (in seconds) or frame index.
    Returns the frame as JPEG bytes.
    """

    # Check if file path exists
    if not os.path.exists(file_path):
        logger.error(f"Video file does not existL {file_path}")
        raise FileNotFoundError(f"Cannot find video file: {file_path}")
    
    # Opens the video file
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        logger.error(f"Failed to open video file: {file_path}")
        raise FileNotFoundError(f"Cannot open video file: {file_path}")
    
    # Seeks desired frame
    try:
        if timestamp is not None:
            cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000) # If timestamp (in seconds) is given, it seeks to that time in the video.
        elif frame_idx is not None:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx) # If frame number is given, it seeks to that frame. cap.set() sets the current position in the video
        else:
            raise ValueError("Either timestamp or frame_idx must be provided.")

        # After seeking, read the frame
        ret, frame = cap.read() # ret is a boolean. Is 
        if not ret or frame is None:
            logger.error("Failed to read frame from video.")
            raise ValueError("Failed to extract frame.")
        
        # Encode as JPEG
        ret, jpeg = cv2.imencode('.jpg', frame)
        if not ret:
            logger.error("Failed to encode frame as JPEG.")
            raise ValueError("Failed to encode frame.")

        return jpeg.tobytes() # Convert JPEG to bytes and return this 
    finally:
        cap.release() # Always release the video file

    