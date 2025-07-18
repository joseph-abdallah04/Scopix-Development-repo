import requests
import json

def test_export_functionality():
    """Test the export functionality with a simple request"""
    
    # Sample test data to verify the export works
    test_export_data = {
        "frames_data": [
            {
                "frame_id": "test-frame-1",
                "frame_idx": 0,
                "timestamp": 0.0,
                "custom_name": "Test Frame 1",
                "measurements": {
                    "glottic_angle": 45.5,
                    "supraglottic_angle": 32.1,
                    "glottic_area": 1234.56,
                    "distance_ratio": {
                        "horizontal_distance": 100.0,
                        "vertical_distance": 80.0,
                        "ratio_percentage": 125.0
                    }
                },
                "calculated_percentages": {},
                "is_baseline": True
            },
            {
                "frame_id": "test-frame-2", 
                "frame_idx": 10,
                "timestamp": 0.334,
                "custom_name": "Test Frame 2",
                "measurements": {
                    "glottic_angle": 38.2,
                    "supraglottic_angle": 28.7,
                    "glottic_area": 1456.78
                },
                "calculated_percentages": {
                    "glottic_angle_closure": -16.1,
                    "supraglottic_angle_closure": -10.6,
                    "glottic_area_closure": 18.0
                },
                "is_baseline": False
            }
        ],
        "baseline_frame_id": "test-frame-1",
        "export_timestamp": "2023-07-17T12:00:00Z"
    }
    
    try:
        response = requests.post(
            'http://0.0.0.0:8000/session/export-results',
            headers={'Content-Type': 'application/json'},
            json=test_export_data
        )
        
        if response.status_code == 200:
            print("✅ Export test successful!")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Content length: {len(response.content)} bytes")
            
            # Save the file for examination
            with open("test_export.xlsx", "wb") as f:
                f.write(response.content)
            print("📁 Exported file saved as 'test_export.xlsx'")
            
        else:
            print(f"❌ Export test failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Export test failed with error: {e}")

if __name__ == "__main__":
    test_export_functionality()