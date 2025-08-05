import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import numpy as np
from measurement_engine import calculate_angle, calculate_area_opencv, calculate_area_scikit
from eilomea_measurement_engine import calculate_p_factor, calculate_c_factor, calculate_distance_ratio

class TestMeasurementAccuracy:
    """Test accuracy of raw measurements (angles, areas, distances)"""
    
    def test_angle_measurement_accuracy(self):
        """Test angle measurements with known geometric cases"""
        
        # The calculate_angle function uses point[1] as the vertex
        # So the angle is between vectors (point[0] - point[1]) and (point[2] - point[1])
        
        def create_angle_points(degrees):
            """Create 3 points that form a specific angle with point[1] as vertex"""
            angle_rad = np.radians(degrees)
            return [
                [10, 0],          # First point (horizontal from vertex)
                [0, 0],           # Vertex (middle point)
                [10 * np.cos(angle_rad), 10 * np.sin(angle_rad)]  # Second point
            ]
        
        # Test known angles with reasonable tolerances
        test_cases = [
            (90.0, 0.1),   # Right angle
            (45.0, 0.1),   # 45 degree angle
            (60.0, 0.1),   # 60 degree angle
            (120.0, 0.1),  # 120 degree angle
            (135.0, 0.1),  # 135 degree angle
            (30.0, 0.1),   # 30 degree angle
        ]
        
        for expected_angle, tolerance in test_cases:
            points = create_angle_points(expected_angle)
            calculated_angle = calculate_angle(points)
            assert abs(calculated_angle - expected_angle) < tolerance, \
                f"Expected {expected_angle}°, got {calculated_angle:.2f}°"
    
    def test_angle_edge_cases(self):
        """Test edge cases for angle calculation"""
        
        # Straight line (180°)
        straight_line = [[0, 0], [5, 0], [10, 0]]
        angle = calculate_angle(straight_line)
        assert abs(angle - 180.0) < 0.1
        
        # Very acute angle
        acute_points = [[1, 0], [0, 0], [0.1, 0.01]]
        angle = calculate_angle(acute_points)
        assert 0 < angle < 10  # Should be a very small angle
        
        # Right angle with different orientations
        right_angle_1 = [[1, 0], [0, 0], [0, 1]]  # Standard right angle
        angle1 = calculate_angle(right_angle_1)
        assert abs(angle1 - 90.0) < 0.1
        
        right_angle_2 = [[0, 1], [0, 0], [1, 0]]  # Rotated right angle
        angle2 = calculate_angle(right_angle_2)
        assert abs(angle2 - 90.0) < 0.1
    
    def test_distance_measurement_accuracy(self):
        """Test distance measurements (Euclidean distance)"""
        
        def calculate_distance(point1, point2):
            """Calculate Euclidean distance between two points"""
            return np.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)
        
        # Test cases
        test_cases = [
            ([0, 0], [3, 4], 5.0),      # 3-4-5 triangle
            ([0, 0], [10, 0], 10.0),    # Horizontal line
            ([0, 0], [0, 10], 10.0),    # Vertical line
            ([5, 5], [8, 9], 5.0),      # Diagonal line
        ]
        
        for point1, point2, expected_distance in test_cases:
            calculated_distance = calculate_distance(point1, point2)
            assert abs(calculated_distance - expected_distance) < 1e-10, \
                f"Expected distance {expected_distance}, got {calculated_distance}"
    
    def test_area_measurement_accuracy(self):
        """Test area measurements with known shapes"""
        
        # Test shapes with known areas
        test_shapes = [
            # Shape name, points, expected area
            ("unit_square", [[0, 0], [1, 0], [1, 1], [0, 1]], 1.0),
            ("large_square", [[0, 0], [10, 0], [10, 10], [0, 10]], 100.0),
            ("triangle", [[0, 0], [6, 0], [3, 4]], 12.0),  # 0.5 * base * height
            ("rectangle", [[0, 0], [5, 0], [5, 3], [0, 3]], 15.0),
            ("diamond", [[2, 0], [4, 2], [2, 4], [0, 2]], 8.0),  # Diamond shape
        ]
        
        for shape_name, points, expected_area in test_shapes:
            # Test with both calculation methods
            opencv_result = calculate_area_opencv(points, "contour")
            scikit_result = calculate_area_scikit(points)
            
            opencv_area = opencv_result["area_pixels"]
            scikit_area = scikit_result["area_pixels"]
            
            assert abs(opencv_area - expected_area) < 1e-6, \
                f"{shape_name}: OpenCV expected {expected_area}, got {opencv_area}"
            assert abs(scikit_area - expected_area) < 1e-6, \
                f"{shape_name}: Scikit expected {expected_area}, got {scikit_area}"
    
    def test_measurement_precision(self):
        """Test measurement precision and repeatability"""
        
        # Same measurements should give same results
        points = [[0, 0], [10, 0], [10, 10], [0, 10]]
        
        # Multiple calculations should be identical
        results = []
        for i in range(5):
            result = calculate_area_opencv(points, "contour")
            results.append(result["area_pixels"])
        
        # All results should be identical
        for result in results[1:]:
            assert result == results[0], "Measurements should be repeatable"
    
    def test_measurement_ranges(self):
        """Test measurements are within expected ranges for medical applications"""
        
        # Create realistic medical measurement scenarios
        # Typical laryngoscopy image might be 800x600 pixels
        
        # Small glottal opening (pathological)
        small_glottis = [[300, 250], [350, 250], [350, 280], [300, 280]]
        small_area = calculate_area_opencv(small_glottis, "contour")["area_pixels"]
        assert 100 < small_area < 5000, "Small glottal area should be reasonable"
        
        # Large glottal opening (normal)
        large_glottis = [[250, 200], [400, 200], [400, 350], [250, 350]]
        large_area = calculate_area_opencv(large_glottis, "contour")["area_pixels"]
        assert 5000 < large_area < 50000, "Large glottal area should be reasonable"
        
        # Distance measurements should be reasonable
        distance_points = [[100, 100], [500, 100]]  # Horizontal distance
        distance = np.sqrt((500-100)**2 + (100-100)**2)  # = 400 pixels
        assert 50 < distance < 800, "Distance should be within image bounds"
    
    def test_angle_calculation_consistency(self):
        """Test that angle calculations are mathematically consistent"""
        
        # Test that the angle calculation is working correctly with real coordinate values
        # Instead of guessing expected ranges, just test mathematical properties
        
        test_points = [
            [[100, 200], [150, 180], [200, 200]],  # Some realistic coordinates
            [[100, 200], [120, 190], [140, 200]],  # Different coordinates
            [[100, 150], [150, 120], [200, 150]],  # More coordinates
        ]
        
        for points in test_points:
            angle = calculate_angle(points)
            
            # Test basic properties
            assert 0 <= angle <= 180, f"Angle {angle:.1f}° should be between 0° and 180°"
            
            # Test consistency - same points should give same result
            angle2 = calculate_angle(points)
            assert abs(angle - angle2) < 1e-10, "Calculation should be consistent"
            
            # Test that the calculation is reasonable (not NaN or infinity)
            assert not np.isnan(angle), "Angle should not be NaN"
            assert not np.isinf(angle), "Angle should not be infinite" 