import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import numpy as np
from measurement_engine import calculate_area_opencv, calculate_area_scikit, calculate_area_comparison, shoelace_area

class TestAreaMeasurement:
    """Test area measurement functionality"""
    
    def test_simple_square(self):
        """Test area calculation for a simple square"""
        # 10x10 square
        points = [[0, 0], [10, 0], [10, 10], [0, 10]]
        
        # Test OpenCV method
        opencv_result = calculate_area_opencv(points, "contour")
        assert abs(opencv_result["area_pixels"] - 100.0) < 1e-6
        assert opencv_result["method"] == "opencv_contour"
        assert opencv_result["point_count"] == 4
        
        # Test scikit-image method
        scikit_result = calculate_area_scikit(points)
        assert abs(scikit_result["area_pixels"] - 100.0) < 1e-6
        assert scikit_result["method"] == "scikit_image"
        assert scikit_result["point_count"] == 4
        assert "centroid" in scikit_result
        assert "bbox" in scikit_result
    
    def test_triangle(self):
        """Test area calculation for a triangle"""
        # Right triangle with base=10, height=5
        points = [[0, 0], [10, 0], [0, 5]]
        expected_area = 25.0  # 0.5 * base * height
        
        # Test OpenCV method
        opencv_result = calculate_area_opencv(points, "contour")
        assert abs(opencv_result["area_pixels"] - expected_area) < 1e-6
        
        # Test scikit-image method
        scikit_result = calculate_area_scikit(points)
        assert abs(scikit_result["area_pixels"] - expected_area) < 1e-6
    
    def test_shoelace_formula(self):
        """Test shoelace formula directly"""
        # Simple triangle
        points = [[0, 0], [4, 0], [0, 3]]
        expected_area = 6.0  # 0.5 * 4 * 3
        
        area = shoelace_area(points)
        assert abs(area - expected_area) < 1e-6
    
    def test_irregular_polygon(self):
        """Test area calculation for an irregular polygon"""
        # Irregular pentagon
        points = [[0, 0], [5, 0], [7, 3], [3, 6], [-1, 3]]
        
        # Test both methods give reasonable results
        opencv_result = calculate_area_opencv(points, "contour")
        scikit_result = calculate_area_scikit(points)
        
        # Both should give positive area
        assert opencv_result["area_pixels"] > 0
        assert scikit_result["area_pixels"] > 0
        
        # Results should be reasonably close (within 5%)
        diff = abs(opencv_result["area_pixels"] - scikit_result["area_pixels"])
        avg = (opencv_result["area_pixels"] + scikit_result["area_pixels"]) / 2
        assert diff / avg < 0.05
    
    def test_area_comparison(self):
        """Test area comparison functionality"""
        points = [[0, 0], [10, 0], [10, 10], [0, 10]]
        
        result = calculate_area_comparison(points)
        
        # Should have results from multiple methods
        assert "opencv_contour" in result
        assert "opencv_shoelace" in result
        assert "scikit_image" in result
        assert "comparison" in result
        
        # Check comparison metrics
        comparison = result["comparison"]
        assert "mean_area" in comparison
        assert "std_area" in comparison
        assert "coefficient_of_variation" in comparison
        assert "methods_compared" in comparison
        assert "recommended_method" in comparison
        
        # All methods should agree on a simple square
        assert abs(comparison["coefficient_of_variation"]) < 1.0  # Less than 1% variation
    
    def test_calibrated_measurements(self):
        """Test calibrated measurements with scale"""
        points = [[0, 0], [10, 0], [10, 10], [0, 10]]  # 100 square pixels
        scale_pixels_per_mm = 2.0  # 2 pixels per mm
        
        result = calculate_area_comparison(points, scale_pixels_per_mm)
        
        # Check that calibrated measurements are added
        scikit_result = result["scikit_image"]
        assert "area_mm2" in scikit_result
        assert "perimeter_mm" in scikit_result
        assert "scale_pixels_per_mm" in scikit_result
        
        # 100 pixels² / (2 pixels/mm)² = 25 mm²
        expected_area_mm2 = 25.0
        assert abs(scikit_result["area_mm2"] - expected_area_mm2) < 1e-6
    
    def test_invalid_inputs(self):
        """Test error handling for invalid inputs"""
        # Too few points
        with pytest.raises(ValueError, match="At least 3 points"):
            calculate_area_opencv([[0, 0], [1, 0]], "contour")
        
        with pytest.raises(ValueError, match="At least 3 points"):
            calculate_area_scikit([[0, 0], [1, 0]])
        
        # Invalid method
        with pytest.raises(ValueError, match="Method must be"):
            calculate_area_opencv([[0, 0], [1, 0], [0, 1]], "invalid")
    
    def test_medical_imaging_properties(self):
        """Test properties useful for medical imaging"""
        # Create an elongated ellipse-like shape
        points = []
        for i in range(20):
            angle = 2 * np.pi * i / 20
            x = 10 * np.cos(angle)
            y = 3 * np.sin(angle)
            points.append([x, y])
        
        result = calculate_area_scikit(points)
        
        # Should have medical imaging properties
        assert "eccentricity" in result
        assert "solidity" in result
        assert "centroid" in result
        
        # Eccentricity should be > 0 for elongated shape
        assert result["eccentricity"] > 0
        
        # Solidity should be <= 1
        assert 0 < result["solidity"] <= 1
        
        # Centroid should be near origin
        centroid = result["centroid"]
        assert abs(centroid[0]) < 1
        assert abs(centroid[1]) < 1

@pytest.mark.parametrize("points,expected_area", [
    # Simple shapes with known areas
    ([[0, 0], [1, 0], [1, 1], [0, 1]], 1.0),  # Unit square
    ([[0, 0], [2, 0], [1, 2]], 2.0),  # Triangle
    ([[0, 0], [3, 0], [3, 4], [0, 4]], 12.0),  # Rectangle
])
def test_area_calculation_parametrized(points, expected_area):
    """Parametrized test for various shapes"""
    opencv_result = calculate_area_opencv(points, "contour")
    scikit_result = calculate_area_scikit(points)
    
    # Both methods should be close to expected area
    assert abs(opencv_result["area_pixels"] - expected_area) < 1e-6
    assert abs(scikit_result["area_pixels"] - expected_area) < 1e-6