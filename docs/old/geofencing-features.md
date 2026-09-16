Current Geofencing Implementation:
When a patient's device sends a location ping with coordinates, speed, and battery status to the backend, the database records the ping and triggers an asynchronous evaluation. The system calculates the distance from the patient's current location to their active geofence zones using the Haversine formula. If the patient is inside any active zone, the state is marked as SAFE. If they are within 80 percent of the boundary of a zone, the state is marked as APPROACHING. If they are outside all active zones, the state is marked as BREACH, creating a deduplicated geofence alert. If the patient remains in a BREACH state, is stationary, and has no user activity for over 10 minutes, the safety state escalates to CRITICAL. These computed states are stored in the patient_states table for immediate access by caregivers and family.

* If a patient exits a defined safe zone like home, clinic, or neighborhood boundaries, all registered caregivers immediately receive an alert with the patient’s live location, movement direction, and last known timestamp.

* When the system detects that one caregiver is geographically closest to the patient during a wandering event, that caregiver receives a priority notification like: “You are closest to John right now. He may need assistance.”

* If the patient continues moving farther away from their safe zone for a prolonged period, the alert escalates automatically from “attention needed” to “high-risk wandering.”

* The app can detect unusual movement at odd hours — for example, if a dementia patient leaves home between midnight and 5 AM — and mark it as a potential emergency even before they leave the geofence completely.

* Caregivers can create “trusted places” such as home, temple, grocery store, clinic, or relative’s house, and the system learns normal movement patterns between them.

* The app can detect when a patient has stopped moving unexpectedly outdoors for a long time and alert caregivers in case of confusion, exhaustion, or a fall.

* A caregiver can enable “Escort Mode” where the app temporarily tracks both caregiver and patient together during hospital visits or outdoor walks and alerts if they become separated.

* The patient device can automatically switch into “high tracking mode” only during risky situations, conserving battery the rest of the day.

* If the patient’s phone battery becomes critically low while outside a safe zone, caregivers receive an early warning before tracking is lost.

* Caregivers can see a simple “state card” instead of raw GPS data:

  * Safe at Home
  * Walking Nearby
  * Outside Safe Area
  * Unknown Location
  * Emergency Monitoring Active

* The app can show a “confidence indicator” for location reliability, helping caregivers know whether the location is precise or estimated.

* A “return home prediction” can estimate whether the patient appears to be heading back toward a safe zone or continuing away from it.

* During emergencies, nearby caregivers or family members can form a temporary “search circle” where each person sees live updates and search coverage areas.

* The app can generate a “last seen journey” timeline showing:

  * where the patient went,
  * how long they stayed,
  * and their movement path before disappearing.

* If the patient enters a dangerous area like highways, railway stations, lakes, construction zones, or isolated areas, the alert severity increases automatically.

* Caregivers can configure “soft boundaries” and “hard boundaries”:

  * Soft = notify only
  * Hard = emergency escalation

* The system can learn daily routines and detect deviations like:

  * skipped morning walk,
  * unusually long outdoor activity,
  * repeated wandering patterns,
  * or sudden inactivity.

* The app can detect “loop wandering,” where a dementia patient repeatedly circles the same streets or areas, which is a common cognitive symptom.

* A caregiver dashboard can show a stress/risk score for each patient based on:

  * wandering frequency,
  * night movement,
  * unsafe areas visited,
  * missed routines,
  * and emergency events.

* If no caregiver responds to a critical alert within a certain time, escalation automatically expands to secondary contacts or emergency services.

* The app can include a one-tap “Guide Patient Home” mode where the caregiver sees walking directions to the patient while the patient receives simplified visual/audio instructions.

* A wearable integration later could allow passive monitoring even if the patient forgets or misplaces the phone.

* The UI should avoid technical maps everywhere and instead use reassurance-focused language:

  * “Safe at home”
  * “Moving nearby”
  * “Needs attention”
  * “Potential wandering detected”

* The caregiver home screen should prioritize:

  1. patient safety state,
  2. recent alerts,
  3. live location access,
  4. battery status,
  5. and emergency actions.

* The app can include “Care Circles,” where neighbors, relatives, or volunteers can optionally help during emergency wandering events.

* A “silent emergency mode” can activate automatically when severe wandering is detected, increasing tracking frequency without requiring user interaction.

* The system can detect when the patient repeatedly approaches exits/doors over several days and warn caregivers about increasing wandering tendencies.

* A “reassurance check-in” feature can periodically ask simple prompts like:

  * “Are you okay?”
  * “Would you like help getting home?”
    with caregiver escalation if ignored.

* If the patient reaches a familiar safe location after wandering, caregivers receive a calming resolution notification instead of continued emergency alerts.

* The app can maintain a “medical profile card” accessible during emergencies with:

  * patient name,
  * dementia condition,
  * emergency contacts,
  * medications,
  * and communication guidance.

* The most valuable long-term feature is not tracking itself, but predictive behavioral safety:
  the app gradually understanding *when wandering is likely before it happens*.
