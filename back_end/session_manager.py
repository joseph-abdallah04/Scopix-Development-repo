from typing import Dict, Optional, List
import uuid
import os
from datetime import datetime
import tempfile

class SingleSessionManager:
    """
    Simple session manager for single active session.
    Stores minimal data in RAM, files on disk
    """

    def __init__(self):
        self.current_session: Optional[dict] = None
        self.session_temp_dir = tempfile.mkdtemp(prefix="video_session_")

    def create_session(self, video_path: str, filename: str, metadata: dict) -> str:
        """Create a new session - clears any existing session first"""
        # Clear existing session if it exists
        if self.current_session:
            self.clear_current_session()
        
        session_id = str(uuid.uuid4())

        # Store minimal data in memory
        self.current_session = {
            "session_id": session_id,
            "video_path": video_path,
            "filename": filename,
            "metadata": metadata,
            "measured_frames": [], # List of frame data
            "baseline_frame_id": None,
            "analysis_type": None
        }

        return session_id

    def get_current_session(self) -> Optional[dict]:
        """Get the current active session"""
        return self.current_session

    def add_measured_frame(self, frame_data: dict) -> str:
        """Add a measured frame to current session"""
        if not self.current_session:
            raise ValueError("No active session")
        
        frame_id = str(uuid.uuid4())
        frame_data["frame_id"] = frame_id
        self.current_session["measured_frames"].append(frame_data)
        return frame_id

    def set_baseline_frame(self, frame_id: str):
        """Set baseline frame for current session"""
        if not self.current_session:
            raise ValueError("No active session")
        self.current_session["baseline_frame_id"] = frame_id
    
    def get_frame_thumbnail(self, frame_id: str) -> bytes:
        """Load thumbnail from disk"""
        if not self.current_session:
            raise ValueError("No active session")
        
        frame = next((f for f in self.current_session["measured_frames"] if f["frame_id"] == frame_id), None)
        if not frame or not frame["thumbnail_path"]:
            raise ValueError("Frame or thumbnail not found")

        with open(frame["thumbnail_path"], "rb") as f:
            return f.read()

    def clear_current_session(self):
        """Clear current session and clean up files"""
        if not self.current_session:
            return
        
        # Delete video file
        if os.path.exists(self.current_session["video_path"]):
            os.remove(self.current_session["video_path"])
        
        # Delete all thumbnail files
        for frame in self.current_session["measured_frames"]:  # Fixed: Use bracket notation instead of parentheses
            if frame.get("thumbnail_path") and os.path.exists(frame["thumbnail_path"]):
                os.remove(frame["thumbnail_path"])
        
        # Clear from memory
        self.current_session = None
    
    def __del__(self):
        """Cleanup when destroyed"""
        try:
            self.clear_current_session()
            if hasattr(self, 'session_temp_dir') and os.path.exists(self.session_temp_dir):
                import shutil
                shutil.rmtree(self.session_temp_dir)
        except:
            pass

# Global single session manager
session_manager = SingleSessionManager()