import cv2
import numpy as np
import math
from skimage import measure, morphology
from typing import List, Tuple, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def calculate_angle(points: List[List[float]]) -> float:
    """
    Calculate angle between three points using the law of cosines
    """
    if len(points) != 3:
        raise ValueError("Exactly 3 points are required to calculate an angle")
    
    # Extract the three points
    p1, p2, p3 = points
    
    # Calculate vectors from the middle point (vertex) to the other two points
    v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
    v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
    
    # Calculate the angle using dot product
    dot_product = np.dot(v1, v2)
    magnitude_v1 = np.linalg.norm(v1)
    magnitude_v2 = np.linalg.norm(v2)
    
    # Handle edge cases
    if magnitude_v1 == 0 or magnitude_v2 == 0:
        return 0.0
    
    # Calculate cosine of angle
    cos_angle = dot_product / (magnitude_v1 * magnitude_v2)
    
    # Clamp to valid range for arccos
    cos_angle = np.clip(cos_angle, -1, 1)
    
    # Calculate angle in radians and convert to degrees
    angle_rad = np.arccos(cos_angle)
    angle_deg = np.degrees(angle_rad)
    
    return float(angle_deg)


def calculate_area_opencv(points: List[List[float]], method: str = "contour") -> Dict[str, Any]:
    """
    Calculate area using OpenCV methods
    
    Args:
        points: List of [x, y] coordinates defining the area boundary
        method: "contour" for contour area, "shoelace" for shoelace formula
    
    Returns:
        Dict with area, perimeter, and method info
    """
    if len(points) < 3:
        raise ValueError("At least 3 points are required to calculate area")
    
    # Convert points to numpy array
    pts = np.array(points, dtype=np.float32)
    
    if method == "contour":
        # Use OpenCV's contour area calculation
        area = cv2.contourArea(pts)
        perimeter = cv2.arcLength(pts, True)  # True for closed contour
        
        return {
            "area_pixels": float(area),
            "perimeter_pixels": float(perimeter),
            "method": "opencv_contour",
            "point_count": len(points)
        }
    
    elif method == "shoelace":
        # Shoelace formula (more accurate for irregular polygons)
        area = shoelace_area(points)
        perimeter = calculate_perimeter(points)
        
        return {
            "area_pixels": float(area),
            "perimeter_pixels": float(perimeter),
            "method": "shoelace_formula",
            "point_count": len(points)
        }
    
    else:
        raise ValueError("Method must be 'contour' or 'shoelace'")


def calculate_area_scikit(points: List[List[float]]) -> Dict[str, Any]:
    """
    Calculate area using scikit-image - using the same approach as OpenCV for consistency
    
    Args:
        points: List of [x, y] coordinates defining the area boundary
    
    Returns:
        Dict with area, perimeter, and method info
    """
    if len(points) < 3:
        raise ValueError("At least 3 points are required to calculate area")
    
    # For better accuracy and consistency with OpenCV, let's use the shoelace formula
    # for area calculation and scikit-image for additional medical properties
    
    # Calculate area using shoelace formula (same as OpenCV contour area for simple polygons)
    area = shoelace_area(points)
    perimeter = calculate_perimeter(points)
    
    # Convert points to numpy array for additional calculations
    pts = np.array(points, dtype=np.float32)
    
    # Calculate centroid (geometric center)
    centroid = [float(np.mean(pts[:, 0])), float(np.mean(pts[:, 1]))]
    
    # Calculate bounding box
    min_x, min_y = np.min(pts, axis=0)
    max_x, max_y = np.max(pts, axis=0)
    bbox = [float(min_x), float(min_y), float(max_x), float(max_y)]
    
    # Calculate additional properties for medical analysis
    # For eccentricity and solidity, we need to create a mask
    width = int(np.ceil(max_x - min_x)) + 4
    height = int(np.ceil(max_y - min_y)) + 4
    
    # Shift points to positive coordinates
    shifted_pts = pts - [min_x - 2, min_y - 2]
    
    # Create binary mask
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillPoly(mask, [shifted_pts.astype(np.int32)], 1)
    
    # Use scikit-image for shape analysis
    try:
        props = measure.regionprops(mask)
        if props:
            main_region = props[0]
            eccentricity = float(main_region.eccentricity)
            solidity = float(main_region.solidity)
        else:
            eccentricity = 0.0
            solidity = 1.0
    except Exception:
        # Fallback values if region analysis fails
        eccentricity = 0.0
        solidity = 1.0
    
    return {
        "area_pixels": float(area),
        "perimeter_pixels": float(perimeter),
        "method": "scikit_image",
        "point_count": len(points),
        "centroid": centroid,
        "bbox": bbox,
        "eccentricity": eccentricity,
        "solidity": solidity
    }


def calculate_area_comparison(points: List[List[float]], 
                            scale_pixels_per_mm: Optional[float] = None) -> Dict[str, Any]:
    """
    Calculate area using multiple methods for comparison
    
    Args:
        points: List of [x, y] coordinates defining the area boundary
        scale_pixels_per_mm: Optional calibration for real-world measurements
    
    Returns:
        Dict with results from all methods and comparison metrics
    """
    results = {}
    
    # OpenCV methods
    try:
        opencv_contour = calculate_area_opencv(points, "contour")
        results["opencv_contour"] = opencv_contour
    except Exception as e:
        results["opencv_contour"] = {"error": str(e)}
    
    try:
        opencv_shoelace = calculate_area_opencv(points, "shoelace")
        results["opencv_shoelace"] = opencv_shoelace
    except Exception as e:
        results["opencv_shoelace"] = {"error": str(e)}
    
    # Scikit-image method (now using consistent area calculation)
    try:
        scikit_result = calculate_area_scikit(points)
        results["scikit_image"] = scikit_result
    except Exception as e:
        results["scikit_image"] = {"error": str(e)}
        logger.warning(f"Scikit-image calculation failed: {e}")
    
    # Add calibrated measurements if scale provided
    if scale_pixels_per_mm:
        for method_name, result in results.items():
            if "error" not in result and "area_pixels" in result:
                result["area_mm2"] = result["area_pixels"] / (scale_pixels_per_mm ** 2)
                result["perimeter_mm"] = result["perimeter_pixels"] / scale_pixels_per_mm
                result["scale_pixels_per_mm"] = scale_pixels_per_mm
    
    # Add comparison metrics
    valid_results = {k: v for k, v in results.items() if "error" not in v}
    if len(valid_results) > 1:
        areas = [r["area_pixels"] for r in valid_results.values()]
        results["comparison"] = {
            "mean_area": float(np.mean(areas)),
            "std_area": float(np.std(areas)),
            "coefficient_of_variation": float(np.std(areas) / np.mean(areas) * 100) if np.mean(areas) != 0 else 0,
            "methods_compared": list(valid_results.keys()),
            "recommended_method": "scikit_image"  # Our recommended method
        }
    
    return results


def shoelace_area(points: List[List[float]]) -> float:
    """
    Calculate area using the shoelace formula (Gauss's area formula)
    More accurate for irregular polygons
    """
    n = len(points)
    if n < 3:
        return 0.0
    
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += points[i][0] * points[j][1]
        area -= points[j][0] * points[i][1]
    
    return abs(area) / 2.0


def calculate_perimeter(points: List[List[float]]) -> float:
    """Calculate perimeter of polygon defined by points"""
    if len(points) < 2:
        return 0.0
    
    perimeter = 0.0
    n = len(points)
    
    for i in range(n):
        j = (i + 1) % n
        dx = points[j][0] - points[i][0]
        dy = points[j][1] - points[i][1]
        perimeter += math.sqrt(dx*dx + dy*dy)
    
    return perimeter


def calculate_distance_ratio(horizontal_points: List[List[float]], vertical_points: List[List[float]]) -> Dict[str, Any]:
    """
    Calculate distance ratio (horizontal/vertical) * 100

    Args:
        horizontal_points: List of 2 [x, y] coordinates for horizontal measurement
        vertical_points: List of 2 [x, y] coordinates for vertical measurement
    
    Returns:
        Dict with horizontal distance, vertical distance, and ratio percentage
    """
    if len(horizontal_points) != 2 or len(vertical_points) != 2:
        raise ValueError("Exactly 2 points are required for each distance measurement")
    
    # Calculate horizontal distance
    h_p1, h_p2 = horizontal_points
    horizontal_distance = math.sqrt((h_p2[0] - h_p1[0])**2 + (h_p2[1] - h_p1[1])**2)

    # Calculate vertical distance
    v_p1, v_p2 = vertical_points
    vertical_distance = math.sqrt((v_p2[0] - v_p1[0])**2 + (v_p2[1] - v_p1[1])**2)

    # Calculate ratio percentage
    if vertical_distance == 0 or horizontal_distance == 0:
        raise ValueError("Vertical distance cannot be zero")

    ratio_percentage = (horizontal_distance / vertical_distance) * 100

    return {
        "horizontal_distance": float(horizontal_distance),
        "vertical_distance": float(vertical_distance),
        "ratio_percentage": float(ratio_percentage),
        "horizontal_points": horizontal_points,
        "vertical_points": vertical_points
    }