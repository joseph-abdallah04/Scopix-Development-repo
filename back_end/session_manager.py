from typing import Dict, Optional, List
import uuid
import os
from datetime import datetime
import tempfile
import logging

class SingleSessionManager:
    """
    Simple session manager for single active session.
    Stores minimal data in RAM, files on disk
    """

    def __init__(self):
        self.current_session = None
        # Create a temporary directory for session files
        import tempfile
        self.session_temp_dir = tempfile.mkdtemp(prefix="rnsh_session_")
        print(f"Session temp directory created: {self.session_temp_dir}")


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
            "analysis_type": None,
            "current_timestamp": 0.0, # Current frame position in seconds
            "current_frame_idx": 0, # Current frame number
            "is_paused": True # Whether video is currently paused
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
        
        # Ensure frame data has the complete structure
        complete_frame_data = {
            "frame_id": frame_id,
            "timestamp": frame_data.get("timestamp"),
            "frame_idx": frame_data.get("frame_idx"),
            "measurements": frame_data.get("measurements", {}),
            "custom_name": frame_data.get("custom_name"),  # Add custom_name field
            "percentage_closure": {
                "glottic_angle": None,
                "supraglottic_angle": None,
                "glottic_area": None,
                "supraglottic_area": None
            },
            "thumbnail_path": frame_data.get("thumbnail_path"),
            "created_at": datetime.now().isoformat()
        }
        
        self.current_session["measured_frames"].append(complete_frame_data)
        return frame_id

    def check_frame_exists(self, frame_idx: int) -> dict | None:
        """Check if a frame with the given frame_idx already exists"""
        if not self.current_session:
            return None
        
        for frame in self.current_session["measured_frames"]:
            if frame["frame_idx"] == frame_idx:
                return frame
        return None

    def remove_measured_frame(self, frame_id: str) -> bool:
        """Remove a measured frame from the session"""
        if not self.current_session:
            return False
        
        original_count = len(self.current_session["measured_frames"])
        self.current_session["measured_frames"] = [
            frame for frame in self.current_session["measured_frames"] 
            if frame["frame_id"] != frame_id
        ]
        
        return len(self.current_session["measured_frames"]) < original_count

    def update_frame_custom_name(self, frame_id: str, custom_name: str) -> bool:
        """Update the custom name of a measured frame"""
        if not self.current_session:
            return False
        
        for frame in self.current_session["measured_frames"]:
            if frame["frame_id"] == frame_id:
                frame["custom_name"] = custom_name
                return True
        return False

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
    

    def update_current_position(self, timestamp: float, frame_idx: int, is_paused: bool = None):
        """Update the current video position in the session"""
        if not self.current_session:
            raise ValueError("No active session")
        
        # Update position
        self.current_session["current_timestamp"] = timestamp
        self.current_session["current_frame_idx"] = frame_idx

        # Update pause state if provided
        if is_paused is not None:
            self.current_session["is_paused"] = is_paused
        
        # Log for debugging purposes
        print(f"Updated position: {timestamp:.2f}s, frame {frame_idx}, paused: {self.current_session["is_paused"]}")


    def calculate_percentage_closures(self) -> None:
        """
        Calculate percentage closures for all frames against current baseline
        """
        if not self.current_session or not self.current_session.get("baseline_frame_id"):
            raise ValueError("No active session or baseline frame set")
        
        baseline_frame_id = self.current_session["baseline_frame_id"]  # Add this line
        
        # Find baseline frame (fixed variable name)
        baseline_frame = next(
            (f for f in self.current_session["measured_frames"] if f["frame_id"] == baseline_frame_id),
            None
        )

        if not baseline_frame:
            raise ValueError("Baseline frame not found")
        
        baseline_measurements = baseline_frame.get("measurements", {})

        # Calculate percentage closure for each frame
        for frame in self.current_session["measured_frames"]:
            current_measurements = frame.get("measurements", {})
            percentage_closure = {}

            # Calculate for each measurement type
            for measurement_type in ["glottic_angle", "supraglottic_angle", "glottic_area", "supraglottic_area"]:
                baseline_key = measurement_type.replace("_angle", "").replace("_area", "")
                area_suffix = "_area" if "_area" in measurement_type else ""
                baseline_key += area_suffix

                if baseline_key in baseline_measurements and baseline_key in current_measurements:
                    if "_area" in measurement_type:
                        # For areas, use area_pixels value
                        baseline_value = baseline_measurements[baseline_key].get("area_pixels")  # Fixed this line
                        current_value = current_measurements[baseline_key].get("area_pixels")
                    else:
                        # For angles, use angle value
                        baseline_value = baseline_measurements[baseline_key].get("angle")
                        current_value = current_measurements[baseline_key].get("angle")

                    if baseline_value and current_value:
                        # Calculate percentage closure: (baseline - current) / baseline * 100
                        percentage_closure[measurement_type] = ((baseline_value - current_value) / baseline_value) * 100
                    else:
                        percentage_closure[measurement_type] = None
                else:
                    percentage_closure[measurement_type] = None
            
            frame["percentage_closure"] = percentage_closure


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