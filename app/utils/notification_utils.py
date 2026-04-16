def send_geofence_alert(
    to_contact: str,
    patient_name: str,
    geofence_name: str,
    latitude: float,
    longitude: float
):
    """
    Sends alert when patient leaves safe zone.
    Currently prints to console.
    Later replace with FCM/SMS/Email.
    """
    google_maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    print("=" * 50)
    print(f"🚨 GEOFENCE ALERT!")
    print(f"Patient {patient_name} left safe zone: {geofence_name}")
    print(f"Location: {google_maps_link}")
    print(f"Alert sent to: {to_contact}")
    print("=" * 50)


def send_geofence_alerts(
    caregiver_email: str,
    emergency_contact: str,
    patient_name: str,
    geofence_name: str,
    latitude: float,
    longitude: float
):
    """Sends alerts to caregiver and emergency contact"""

    # Alert caregiver
    send_geofence_alert(
        caregiver_email,
        patient_name,
        geofence_name,
        latitude,
        longitude
    )

    # Alert emergency contact if exists
    if emergency_contact:
        send_geofence_alert(
            emergency_contact,
            patient_name,
            geofence_name,
            latitude,
            longitude
        )