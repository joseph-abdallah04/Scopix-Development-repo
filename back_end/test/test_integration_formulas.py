import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from session_manager import SingleSessionManager
from eilomea_measurement_engine import calculate_p_factor, calculate_c_factor, calculate_distance_ratio

class TestFormulaIntegration:
    """Test the complete measurement-to-formula pipeline"""
    
    def test_complete_measurement_pipeline(self):
        """Test the complete pipeline from measurements to final formulas"""
        
        # Create test measurements that match your screenshot
        test_measurements = {
            "angle_a": 74.7,
            "angle_b": 138.0,
            "area_a": 1200.0,    # This should give P-factor ≈ 216.727 when distance_a ≈ 5.54
            "area_b": 8500.0,
            "area_av": 900.0,    # Together with area_bv should give C-factor = 0.813
            "area_bv": 3900.0,   # 3900/(900+3900) = 0.813
            "distance_a": 5.54,  # 1200/5.54 ≈ 216.7
            "distance_c": 7.9,
            "distance_g": 5.34,  # Should give ratios matching your screenshot
            "distance_h": 18.19
        }
        
        # Calculate formulas using session manager method
        session_manager = SingleSessionManager()
        formulas = session_manager.calculate_formulas(test_measurements)
        
        # Verify the calculated formulas match expected values (from your screenshot)
        expected_formulas = {
            "p_factor": 216.727,
            "c_factor": 0.813,
            "distance_ratio_1": 0.964,  # distance_g / distance_a
            "distance_ratio_2": 0.675,  # distance_g / distance_c  
            "distance_ratio_3": 3.284,  # distance_h / distance_a
            "distance_ratio_4": 2.302   # distance_h / distance_c
        }
        
        tolerance = 0.01  # 1% tolerance
        
        for formula_name, expected_value in expected_formulas.items():
            if formula_name in formulas:
                calculated_value = formulas[formula_name]
                assert abs(calculated_value - expected_value) / expected_value < tolerance, \
                    f"{formula_name}: expected {expected_value}, got {calculated_value}"
    
    def test_formula_dependencies(self):
        """Test that formulas depend on correct measurement inputs"""
        
        # Test P-factor dependency
        measurements_with_area_a = {"area_a": 100, "distance_a": 5}
        measurements_without_area_a = {"distance_a": 5}
        
        session_manager = SingleSessionManager()
        
        formulas_with = session_manager.calculate_formulas(measurements_with_area_a)
        formulas_without = session_manager.calculate_formulas(measurements_without_area_a)
        
        assert "p_factor" in formulas_with
        assert "p_factor" not in formulas_without
        
        # Test C-factor dependency
        measurements_with_areas = {"area_bv": 100, "area_av": 50}
        measurements_without_areas = {"area_bv": 100}
        
        formulas_with = session_manager.calculate_formulas(measurements_with_areas)
        formulas_without = session_manager.calculate_formulas(measurements_without_areas)
        
        assert "c_factor" in formulas_with
        assert "c_factor" not in formulas_without
    
    def test_error_handling_in_pipeline(self):
        """Test error handling in the complete pipeline"""
        
        # Test division by zero scenarios
        zero_distance_measurements = {
            "area_a": 100,
            "distance_a": 0  # This should not crash the system
        }
        
        session_manager = SingleSessionManager()
        formulas = session_manager.calculate_formulas(zero_distance_measurements)
        
        # Should not contain p_factor due to division by zero
        assert "p_factor" not in formulas
        
        # Test with empty measurements
        empty_measurements = {}
        formulas = session_manager.calculate_formulas(empty_measurements)
        assert len(formulas) == 0 