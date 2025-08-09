import subprocess
import sys
import os

def run_measurement_tests():
    """Run all measurement and formula tests using uv"""
    
    print("Running Medical Measurement Tests")
    print("=" * 50)
    
    # Change to the back_end directory
    os.chdir(os.path.dirname(os.path.dirname(__file__)))
    
    # Run specific test modules using uv
    test_modules = [
        "test/test_formula_calculations.py",
        "test/test_measurement_accuracy.py", 
        "test/test_integration_formulas.py",
        "test/test_area_measurement.py",  # Existing
        "test/test_measurement_engine.py"  # Existing
    ]
    
    all_passed = True
    
    for module in test_modules:
        print(f"\n📋 Running {module}")
        try:
            result = subprocess.run(
                ["uv", "run", "pytest", module, "-v"], 
                capture_output=False,
                text=True
            )
            if result.returncode != 0:
                all_passed = False
                print(f"❌ {module} FAILED")
            else:
                print(f"✅ {module} PASSED")
        except Exception as e:
            print(f"❌ Error running {module}: {e}")
            all_passed = False
    
    # Run coverage report
    print(f"\n📊 Generating coverage report...")
    try:
        subprocess.run(
            ["uv", "run", "pytest", "test/", "--cov=.", "--cov-report=term"],
            capture_output=False
        )
    except Exception as e:
        print(f"Warning: Could not generate coverage report: {e}")
    
    if all_passed:
        print(f"\n🎉 All tests PASSED! Your measurements are accurate.")
        return 0
    else:
        print(f"\n❌ Some tests FAILED. Check the output above.")
        return 1

if __name__ == "__main__":
    exit_code = run_measurement_tests()
    sys.exit(exit_code) 