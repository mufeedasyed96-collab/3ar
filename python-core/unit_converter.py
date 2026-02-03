"""
Unit Conversion Utilities
Handles conversion from DXF INSUNITS to meters for consistent calculations.
"""

from typing import Optional


# INSUNITS values from DXF specification
INSUNITS_INCHES = 1
INSUNITS_FEET = 2
INSUNITS_CENTIMETERS = 3
INSUNITS_MILLIMETERS = 4
INSUNITS_METERS = 5
INSUNITS_METERS_ALT = 6  # Alternative meters value


def convert_length_to_meters(length: float, insunits: int) -> float:
    """
    Convert length to meters based on INSUNITS.
    
    Args:
        length: Length value in original units
        insunits: INSUNITS value from DXF (1=inches, 2=feet, 3=cm, 4=mm, 5/6=meters)
        
    Returns:
        Length in meters
    """
    if insunits == INSUNITS_INCHES:  # inches
        return length / 39.3701  # 1 inch = 0.0254 m
    elif insunits == INSUNITS_FEET:  # feet
        return length / 3.28084  # 1 foot = 0.3048 m
    elif insunits == INSUNITS_CENTIMETERS:  # centimeters
        return length / 100.0  # 1 cm = 0.01 m
    elif insunits == INSUNITS_MILLIMETERS:  # millimeters
        return length / 1000.0  # 1 mm = 0.001 m
    elif insunits == INSUNITS_METERS or insunits == INSUNITS_METERS_ALT:  # meters
        return length  # Already in meters
    else:
        # Default: try to detect unit based on magnitude
        # If length is very large (> 50), likely in mm
        if length > 50:
            return length / 1000.0  # Assume mm
        # If length is large (> 5), likely in cm
        elif length > 5:
            return length / 100.0  # Assume cm
        # Otherwise assume already in m
        else:
            return length


def convert_area_to_m2(area: float, insunits: int) -> float:
    """
    Convert area to square meters based on INSUNITS.
    
    Args:
        area: Area value in original units squared
        insunits: INSUNITS value from DXF (1=inches, 2=feet, 3=cm, 4=mm, 5/6=meters)
        
    Returns:
        Area in square meters
    """
    if insunits == INSUNITS_INCHES:  # square inches
        return area / 1550.0031  # 1 in² = 0.00064516 m²
    elif insunits == INSUNITS_FEET:  # square feet
        return area / 10.7639  # 1 ft² = 0.092903 m²
    elif insunits == INSUNITS_CENTIMETERS:  # square centimeters
        return area / 10000.0  # 1 cm² = 0.0001 m²
    elif insunits == INSUNITS_MILLIMETERS:  # square millimeters
        return area / 1000000.0  # 1 mm² = 0.000001 m²
    elif insunits == INSUNITS_METERS or insunits == INSUNITS_METERS_ALT:  # square meters
        return area  # Already in m²
    else:
        # Default: try to detect unit based on area magnitude
        # If area is very large (> 1,000,000), likely in mm²
        if area > 1000000:
            return area / 1000000.0  # Assume mm²
        # If area is large (> 10,000), likely in cm²
        elif area > 10000:
            return area / 10000.0  # Assume cm²
        # Otherwise assume already in m²
        else:
            return area


def get_insunits_from_metadata(metadata: dict) -> int:
    """
    Get INSUNITS value from metadata, with fallback to default.
    
    Args:
        metadata: Metadata dictionary that may contain 'insunits'
        
    Returns:
        INSUNITS value (defaults to 4 = millimeters if not found)
    """
    insunits = metadata.get('insunits', 4)  # Default to millimeters
    # Ensure it's a valid integer
    try:
        insunits = int(insunits)
        # Validate range (1-6 are valid INSUNITS values)
        if insunits < 1 or insunits > 6:
            return 4  # Default to millimeters if invalid
        return insunits
    except (ValueError, TypeError):
        return 4  # Default to millimeters if not a number


def normalize_length(length: Optional[float], metadata: dict) -> Optional[float]:
    """
    Normalize length to meters using metadata insunits.
    
    Args:
        length: Length value (may be None or in original units)
        metadata: Metadata dictionary containing 'insunits'
        
    Returns:
        Length in meters, or None if input is None
    """
    if length is None:
        return None
    
    insunits = get_insunits_from_metadata(metadata)
    return convert_length_to_meters(length, insunits)


def normalize_area(area: Optional[float], metadata: dict) -> Optional[float]:
    """
    Normalize area to square meters using metadata insunits.
    
    Args:
        area: Area value (may be None or in original units)
        metadata: Metadata dictionary containing 'insunits'
        
    Returns:
        Area in square meters, or None if input is None
    """
    if area is None:
        return None
    
    insunits = get_insunits_from_metadata(metadata)
    return convert_area_to_m2(area, insunits)


def get_unit_name(insunits: int) -> str:
    """
    Get human-readable unit name for INSUNITS value.
    
    Args:
        insunits: INSUNITS value
        
    Returns:
        Unit name string
    """
    unit_names = {
        INSUNITS_INCHES: "inches",
        INSUNITS_FEET: "feet",
        INSUNITS_CENTIMETERS: "centimeters",
        INSUNITS_MILLIMETERS: "millimeters",
        INSUNITS_METERS: "meters",
        INSUNITS_METERS_ALT: "meters"
    }
    return unit_names.get(insunits, "unknown")

