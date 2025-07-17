#!/usr/bin/env python3
"""Debug script to verify area calculations"""

from measurement_engine import calculate_area_opencv, calculate_area_scikit, calculate_area_comparison

def debug_area_calculation():
    """Debug area calculation with known shapes"""
    
    # Test cases
    test_cases = [
        {
            "name": "10x10 Square",
            "points": [[0, 0], [10, 0], [10, 10], [0, 10]],
            "expected_area": 100.0
        },
        {
            "name": "Triangle (base=10, height=5)",
            "points": [[0, 0], [10, 0], [0, 5]],
            "expected_area": 25.0
        },
        {
            "name": "Unit Square",
            "points": [[0, 0], [1, 0], [1, 1], [0, 1]],
            "expected_area": 1.0
        },
        {
            "name": "Rectangle (3x4)",
            "points": [[0, 0], [3, 0], [3, 4], [0, 4]],
            "expected_area": 12.0
        }
    ]
    
    for test_case in test_cases:
        print(f"\n=== {test_case['name']} ===")
        print(f"Points: {test_case['points']}")
        print(f"Expected area: {test_case['expected_area']}")
        
        # Calculate using all methods
        try:
            opencv_result = calculate_area_opencv(test_case['points'], "contour")
            print(f"OpenCV area: {opencv_result['area_pixels']:.2f}")
        except Exception as e:
            print(f"OpenCV error: {e}")
        
        try:
            scikit_result = calculate_area_scikit(test_case['points'])
            print(f"Scikit-image area: {scikit_result['area_pixels']:.2f}")
        except Exception as e:
            print(f"Scikit-image error: {e}")
        
        try:
            comparison_result = calculate_area_comparison(test_case['points'])
            if "comparison" in comparison_result:
                comp = comparison_result["comparison"]
                print(f"Mean area: {comp['mean_area']:.2f}")
                print(f"Std area: {comp['std_area']:.2f}")
                print(f"Coefficient of variation: {comp['coefficient_of_variation']:.2f}%")
        except Exception as e:
            print(f"Comparison error: {e}")

if __name__ == "__main__":
    debug_area_calculation()