import pytest
from measurement_engine import calculate_angle

@pytest.mark.parametrize("points,expected", [
    # Right angle (90°)
    ([[0, 0], [1, 0], [1, 1]], 90.0),
    # Straight line (180°)
    ([[0, 0], [1, 0], [2, 0]], 180.0),
    # Acute angle (45°)
    ([[2, 0], [1, 0], [2, 1]], 45.0),
    # Obtuse angle (135°)
    ([[0, 0], [1, 0], [2, -1]], 135.0),
    # Equilateral triangle (60°)
    ([[0, 0], [1, 0], [0.5, 0.8660254]], 60.0),
    # Reflex angle (should still return 135°)
    ([[2, -1], [1, 0], [0, 0]], 135.0),
    # Colinear, reversed (180°)
    ([[2, 0], [1, 0], [0, 0]], 180.0),
])
def test_calculate_angle(points, expected):
    angle = calculate_angle(points)
    assert pytest.approx(angle, abs=1e-2) == expected


def test_invalid_points():
    # Less than 3 points
    with pytest.raises(ValueError):
        calculate_angle([[0, 0], [1, 0]])
    # More than 3 points
    with pytest.raises(ValueError):
        calculate_angle([[0, 0], [1, 0], [2, 0], [3, 0]]) 