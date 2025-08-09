def calculate_c_factor(area_bv: float, area_av: float) -> float:
    """
    Calculates C-factor (Supraglottic Obstruction): Standardised ratio representing how open the supraglottis is

    input:
        area_bv: the actual open area of the supraglottis
        area_av: the area of the obstructed (closed) tissue in the supraglottis

    output:
        c_factor: the calculated C-factor

        Formula:
        c_factor = area_bv / (area_bv + area_av)
    """
    if area_bv + area_av == 0:
        raise ValueError("The sum of area_bv and area_av must not be zero to avoid division by zero.")
    return area_bv / (area_bv + area_av)

def calculate_p_factor(area_d: float, distance_a: float) -> float:
    """
    Calculates P-factor (Glottic Obstruction): Standardised value for glottic opening

    input:
        area_d: the area of the posterior opening between the vocal cords (posterior commissure)
        distance_a: the reference width of the laryngeal inlet at its widest point (at the aryepiglottic folds)
    
    returns:
        p_factor: the calculated P-factor

        Formula:
        p_factor = area_d / distance_a
    """
    if distance_a == 0:
        raise ValueError("distance_a must not be zero to avoid division by zero.")
    return area_d / distance_a

def calculate_distance_ratio(distance_one: float, distance_two: float) -> float:
    """
    Calculates the ratio of two distances

    input:
        distance_one: the first distance value
        distance_two: the second distance value

    returns:
        distance_ratio: the calculated ratio of the two distances

        Formula:
        distance_ratio = distance_one / distance_two
    """
    if distance_two == 0:
        raise ValueError("distance_two must not be zero to avoid division by zero.")
    return distance_one / distance_two

def calculate_supraglottic_area_ratio_1(area_b: float, distance_a: float) -> float:
    """
    Calculates Supraglottic Area Ratio 1

    input:
        area_b: Area B measurement
        distance_a: Distance A measurement

    returns:
        supraglottic_area_ratio_1: the calculated ratio

        Formula:
        supraglottic_area_ratio_1 = area_b / distance_a
    """
    if distance_a == 0:
        raise ValueError("distance_a must not be zero to avoid division by zero.")
    return area_b / distance_a

def calculate_supraglottic_area_ratio_2(area_b: float, distance_a: float, distance_c: float) -> float:
    """
    Calculates Supraglottic Area Ratio 2

    input:
        area_b: Area B measurement
        distance_a: Distance A measurement
        distance_c: Distance C measurement

    returns:
        supraglottic_area_ratio_2: the calculated ratio

        Formula:
        supraglottic_area_ratio_2 = area_b / (distance_a + distance_c)
    """
    if distance_a + distance_c == 0:
        raise ValueError("The sum of distance_a and distance_c must not be zero to avoid division by zero.")
    return area_b / (distance_a + distance_c)