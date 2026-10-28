# Workflow: Location and Safe Zones

## Purpose

Define how SureStep collects, displays, and uses Patient location data and how Safe Zones are created, monitored, and used to generate safety alerts.

Location access, Safe Zone management, and safety-alert response are separate capabilities. Having access to one does not automatically grant the others.

---

# 1. Location Permission

### Actor
Patient or authorized person acting on behalf of the Patient.

### Goal
Allow SureStep to collect the Patient's location.

### Preconditions
- Patient account exists.
- The user has permission to configure location access for that Patient.

### Flow

1. User opens Location settings.
2. System displays the current location-permission state.
3. User enables location access.
4. System requests the required device/location permission.
5. If permission is granted:
   - location collection becomes available;
   - the system records the permission state.
6. If permission is denied:
   - location collection remains unavailable;
   - existing location data is not presented as current/live.

### Rules

- Device permission is required for location collection.
- SureStep must not claim to have current location when the device has not provided a sufficiently recent location.
- Location access is independent from:
  - SOS alert receipt;
  - Safe Zone management;
  - caregiver relationship;
  - Patient assignment.
- Granting location access does not automatically grant every Circle member access to location.

### Failure / Edge Cases

**Permission denied**
- Location remains unavailable.
- Safe Zone monitoring that depends on location cannot reliably determine the Patient's current location.

**Permission revoked later**
- System detects that location collection is unavailable.
- Location-dependent functionality reflects the unavailable state.
- Safe Zone monitoring must not represent the Patient as safely inside a zone or as having breached a zone when the current location cannot be determined.

**Device offline**
- No new location is treated as current.
- Last known location may be shown only with its freshness clearly indicated.

---

# 2. Location Collection

### Actor
System.

### Goal
Maintain location information when the Patient has enabled the required permissions.

### Preconditions

- Patient has enabled location access.
- Device can provide a location.

### Flow

1. Device provides a location.
2. SureStep records the location with its timestamp.
3. System updates the Patient's latest known location.
4. Location-dependent features use the latest location according to its freshness.

### Location Freshness

The system distinguishes between:

- **Current** — sufficiently recent for the relevant operation.
- **Recent** — available but not current enough to represent live location.
- **Stale** — too old to represent the Patient's current whereabouts reliably.
- **Unavailable** — no usable location is available.

Exact freshness thresholds are defined by the technical architecture, not this workflow.

### Rules

- Every location value has a timestamp.
- Location freshness must be represented wherever it materially affects a safety decision.
- Stale or unavailable location must never be represented as live/current.
- When location becomes stale or unavailable while Safe Zone monitoring depends on it, the system must not represent the Patient as confirmed safe or as having breached a Safe Zone.
- Any user-facing indication of impaired monitoring must communicate that SureStep cannot reliably determine the Patient's current location.

---

# 3. Patient Location Visibility

### Actor
Patient, Family Member, or Professional Caregiver with location access.

### Goal
View the Patient's available location.

### Preconditions

- Patient is associated with the relevant Care Circle.
- Actor has the required location-access permission.
- A usable location exists.

### Flow

1. Actor opens the Patient's location.
2. System checks:
   - Circle membership/association;
   - actor's location permission;
   - Patient's available location;
   - location freshness.
3. If authorized, system displays the latest usable location and its freshness.
4. If location is stale or unavailable, system clearly communicates that state.

### Rules

- Circle membership alone does not grant location access.
- Caregiver relationship alone does not grant location access.
- Patient assignment alone does not grant location access.
- Location access must be checked when the protected operation is performed.
- Removing a user's location permission immediately prevents further protected location access.

### Failure

**Unauthorized user**
- Location is not disclosed.

**Location unavailable**
- System shows that location is unavailable rather than displaying fabricated/current information.

**Stale location**
- System displays it as stale/recent according to the applicable freshness state.

---

# 4. Safe Zone Creation and Ownership

### Actor
User with Safe Zone management permission (`Manage Safe Zones`).

### Goal
Create a designated geographic area for monitoring one or multiple Patients within the Care Circle.

### Preconditions

- Care Circle exists and is active.
- Monitored Patient(s) belong to the Care Circle.
- Actor has the `Manage Safe Zones` permission.
- Location information is available sufficiently to configure the zone boundary.

### Flow

1. Actor opens Safe Zone management.
2. Actor selects one or multiple Patients in the Care Circle to be monitored by this zone.
3. Actor chooses a location/area.
4. Actor defines the Safe Zone boundary.
5. System displays the configured area and monitored Patient associations for review.
6. Actor confirms creation.
7. System creates the Safe Zone as a Care Circle resource.
8. Safe Zone monitoring becomes active for the designated Patient(s).

### Safe Zone Data

A Safe Zone contains at minimum:

- Care Circle association (ownership);
- monitored Patient association(s) (monitoring configuration);
- name;
- geographic boundary;
- active/inactive state;
- creation information;
- modification information.

### Rules

- **Care Circle Ownership:** Safe Zones belong to the Care Circle, not to an individual Patient.
- **Multi-Patient Monitoring:** A Safe Zone may monitor one or multiple Patients belonging to that Care Circle.
- **Monitoring Configuration vs Ownership:** Patient associations represent monitoring configuration, not zone ownership.
- **Permission Boundary:** Creating a Safe Zone does not grant the creator general Patient-data access beyond the permissions already held.
- **Separation of Concerns:** Safe Zone management is separate from receiving Safe Zone alerts. A user who can receive an alert does not automatically gain permission to modify the Safe Zone.

---

# 5. Safe Zone Modification

### Actor
User with Safe Zone management permission.

### Flow

1. Actor opens an existing Safe Zone.
2. System verifies permission.
3. Actor modifies the allowed configuration (boundary, name, or monitored Patient associations).
4. System shows the resulting boundary, settings, and monitored Patients.
5. Actor confirms the change.
6. System saves the new configuration.

### Rules

- Historical breach events are not rewritten when a Safe Zone is modified.
- A modification affects future monitoring.
- If a monitored Patient is already outside the newly configured boundary, the system evaluates the new location through the normal breach-detection process.
- Modifying a Safe Zone does **not** silently resolve an already-active safety alert.

---

# 6. Safe Zone Deactivation

### Actor
User with Safe Zone management permission.

### Goal
Temporarily stop monitoring a Safe Zone while retaining its configuration.

### Flow

1. Actor selects the active Safe Zone.
2. System requires explicit confirmation.
3. Actor confirms deactivation.
4. System changes the Safe Zone to inactive.
5. Future breach detection for that zone stops for all associated Patients while it is inactive.

### Rules

- Deactivation retains the Safe Zone configuration.
- An inactive Safe Zone does not generate new breach events.
- Deactivation does **not** silently resolve an already-active safety alert.
- Existing alerts remain governed by `07-SAFETY.md`.

---

# 7. Safe Zone Deletion and Multi-Patient Circle Lifecycle

### Actor
User with Safe Zone management permission.

### Goal
Remove a Safe Zone from the active configuration or handle changes when Patients leave the Circle.

### Flow (Deletion)

1. Actor selects the Safe Zone.
2. System requires explicit confirmation.
3. Actor confirms deletion.
4. System removes the Safe Zone from active configuration.
5. Future breach detection for that zone stops.

### Rules for Safe Zone Deletion

- Deletion is distinct from deactivation.
- A deleted Safe Zone is no longer available as an active monitoring configuration.
- Deletion does **not** silently resolve an already-active safety alert.
- Existing alerts remain governed by `07-SAFETY.md`.
- Historical safety activity is not rewritten merely because its Safe Zone configuration was deleted.

### Multi-Patient Behavior When a Patient Leaves the Circle

When a Patient leaves or is removed from the Care Circle:

1. **Remove from Monitoring Configuration:** The system immediately removes that Patient from the monitoring configuration of all Circle Safe Zones.
2. **Remaining Patients Active:** If other monitored Patients remain in the Safe Zone's configuration, the zone remains active and continues monitoring the remaining Patients.
3. **Deactivation if No Patients Remain:** If no monitored Patients remain in the zone's configuration, the system automatically deactivates monitoring for that zone and retains the configuration, unless the Circle Owner explicitly deletes the zone.
4. **No Silent Alert Resolution:** Removing a Patient, editing a zone, or deactivating a zone must **never** silently resolve an existing safety alert. Existing safety alerts remain governed by the alert lifecycle in `07-SAFETY.md`.
5. **No Continued Monitoring:** Monitoring does **not** continue for a Patient after Circle-based monitoring access ends. All Circle-derived location tracking and breach detection for that Patient cease immediately.

---

# 8. Safe Zone Breach Detection

### Actor
System.

### Goal
Detect when a Patient moves outside an active Safe Zone.

### Preconditions

- Active Safe Zone exists.
- Patient has usable location data.
- Location monitoring is functioning.

### Flow

1. System receives a new usable Patient location.
2. System evaluates the location against the Patient's active Safe Zones.
3. If the Patient remains inside the relevant zone, no breach alert is created.
4. If the Patient crosses outside the configured boundary:
   - the system records a breach event;
   - the Safety workflow creates a Safe Zone alert;
   - users permitted to receive that alert are notified.
5. The Patient receives the configured calm/reassuring safety message.

### Rules

- Safe Zone detection depends on usable location data.
- If location becomes stale or unavailable, the system cannot reliably determine whether the Patient is inside or outside the Safe Zone.
- Location loss must not be interpreted as:
  - a confirmed Safe Zone breach;
  - confirmed safety;
  - automatic resolution of an existing alert.
- Safe Zone breach handling follows the alert lifecycle defined in `07-SAFETY.md`.
- This workflow introduces no separate escalation lifecycle.
- The system does not imply that a responder has been dispatched.
- Returning inside the Safe Zone does **not** automatically resolve an active safety alert.

---

# 9. Safe Zone Alert Access

Safe Zone breach alerts are governed by the Safety workflow.

Notification recipients are the users permitted to receive the relevant alert under the V1 notification and alert-permission rules.

The following capabilities remain separate:

| Capability | Grants |
|---|---|
| Safe Zone management | Create/modify/deactivate/delete Safe Zones |
| Safe Zone alert permission | Receive/respond to Safe Zone alerts |
| Location access | View available Patient location |
| Caregiver relationship | Establishes caregiver relationship |
| Patient assignment | Associates caregiver with Patient |
| Circle membership | Membership in the Care Circle |

Possessing one capability does not automatically grant the others.

A Circle member or caregiver is not automatically an alert recipient merely because they belong to the Circle or have a caregiver relationship.

---

# 10. Location During a Safety Alert

### Actor
Authorized safety responder.

### Flow

1. A Safe Zone breach or SOS alert is active.
2. Responder opens the alert.
3. System checks the responder's location-access permission.
4. If authorized and usable location exists:
   - responder can view the available Patient location;
   - freshness is displayed.
5. If location is stale or unavailable:
   - system clearly communicates that the Patient's current location cannot be reliably determined.

### Response Actions

Where supported by the responder's permissions, the responder may:

- view available location;
- call the Patient;
- get directions;
- select `I'm Responding`;
- resolve the alert.

`I'm Responding` does not resolve the alert.

Alert lifecycle and resolution are defined in `07-SAFETY.md`.

This workflow does not introduce dispatch, automatic escalation, or automatic emergency-service contact.

---

# 11. Location Permission Loss

### Cases

#### Patient disables device location

- New location data cannot be collected.
- Existing location is not presented as current.
- Safe Zone monitoring cannot reliably determine whether the Patient is inside or outside the zone.
- The system must not represent location loss as confirmed safety or as a detected breach.
- User-facing status must communicate that monitoring cannot reliably determine the Patient's current location.

#### User loses location-access permission

- Protected location views immediately become unavailable.
- Existing sessions must not bypass the permission change.

#### Patient's device is offline

- No new location is treated as current.
- Previously recorded location retains its timestamp/freshness state.
- Safe Zone monitoring cannot claim a current position without new usable location data.

---

# 12. Circle Lifecycle Interaction

### Circle deletion

When a Care Circle is deleted:

- Circle membership ends.
- Circle-derived location access ends.
- Circle-derived Safe Zones stop active monitoring.
- Circle-derived caregiver access ends.
- Circle-derived Safe Zone alert permissions end.

Patient-owned information and settings remain with the Patient account.

A retained Patient-owned SOS/help setting does **not** imply that Circle-based monitoring, Safe Zones, alerts, or response coverage continue after the Circle is deleted.

Circle deletion does not automatically create, assign, or grant access to another caregiver.

### Caregiver suspension/termination

When a caregiver relationship is suspended or terminated:

- relationship-derived access is revoked;
- Patient assignment derived from that relationship becomes inactive;
- affected location permissions are reevaluated;
- affected safety-alert permissions are reevaluated;
- no permissions are automatically granted to another caregiver.

Existing safety alerts remain governed by the Safety workflow.

This workflow does not define a separate safety-responsibility assignment, transfer, handover, or safety-gap process.

---

# 13. Audit

The system records relevant location/Safe Zone actions, including:

- Safe Zone creation;
- Safe Zone modification;
- Safe Zone deactivation;
- Safe Zone deletion;
- permission changes affecting location;
- relevant safety events generated from Safe Zone breaches.

Audit records identify the actor/system action and affected Patient/Safe Zone where applicable.

---

# Acceptance Criteria

1. A user without location permission cannot view protected Patient location.
2. Circle membership alone does not grant location access.
3. Caregiver relationship alone does not grant location access.
4. Patient assignment alone does not grant location access.
5. Location is always associated with a timestamp/freshness state.
6. Stale location is never presented as live/current.
7. When location becomes stale or unavailable, SureStep does not represent the Patient as confirmed safe or as having breached a Safe Zone.
8. When Safe Zone monitoring is impaired by unavailable location, the user-facing status communicates that SureStep cannot reliably determine the Patient's current location.
9. Safe Zones can only be managed by users with the required Safe Zone-management authority.
10. Safe Zone management does not automatically grant alert-response permission.
11. Receiving Safe Zone alerts does not automatically grant Safe Zone-management permission.
12. A valid location outside an active Safe Zone creates a Safe Zone safety event.
13. Loss of location does not create a Safe Zone breach event.
14. Returning inside a Safe Zone does not automatically resolve an active safety alert.
15. `I'm Responding` does not resolve an alert.
16. Deactivating a Safe Zone does not silently resolve an existing safety alert.
17. Deleting a Safe Zone does not silently resolve an existing safety alert.
18. Deactivation retains the Safe Zone configuration while stopping active monitoring.
19. Deletion removes the Safe Zone from active configuration.
20. Safe Zone notifications are sent only to users permitted to receive the relevant alert under the V1 notification/alert rules.
21. The location workflow does not introduce automatic escalation, emergency dispatch, or automatic emergency-service contact.
22. Safe Zones belong to the Care Circle, not an individual Patient.
23. A Safe Zone may monitor one or multiple Patients belonging to the Care Circle; Patient associations represent monitoring configuration, not zone ownership.
24. If one Patient leaves or is removed from the Circle, that Patient is removed from the monitoring configuration; the zone remains active for remaining Patients, or is deactivated if no Patients remain.
25. Removing a Patient, editing a zone, deactivating a zone, or deleting a zone never silently resolves an active safety alert.
26. Monitoring does not continue for a Patient after Circle-based monitoring access ends.
27. Circle deletion stops Circle-derived Safe Zone monitoring and Circle-derived location/alert access.
28. Patient-owned settings remaining after Circle deletion do not imply that Circle-based monitoring or alerts continue.
29. When caregiver access ends, affected permissions are reevaluated; another caregiver is not automatically granted access.
30. Protected location operations re-check current authorization rather than relying only on an existing session.
31. Location and Safe Zone actions are auditable.