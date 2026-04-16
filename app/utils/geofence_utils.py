import math

def calculate_distance_meters(
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> float:
    """
    Calculates distance between two GPS points in meters.
    """
    R = 6371000  # Earth radius in meters

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_inside_geofence(
    patient_lat: float, patient_lon: float,
    geofence_lat: float, geofence_lon: float,
    radius_meters: float
) -> bool:
    """
    Returns True if patient is inside safe zone.
    Returns False if patient is outside.
    """
    distance = calculate_distance_meters(
        patient_lat, patient_lon,
        geofence_lat, geofence_lon
    )
    return distance <= radius_meters