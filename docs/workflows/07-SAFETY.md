# Workflow: Safety

## Purpose

Define the V1 safety workflows for:

- Patient SOS/help
- Safe Zone breach alerts
- Authorized alert recipients
- Responding to alerts
- Viewing relevant Patient location during a safety event
- Human resolution of safety incidents
- Safety-related consequences of caregiver access changes

V1 does **not** introduce a general safety-responsibility assignment system, automatic emergency dispatch, or automatic emergency escalation.

The location and Safe Zone configuration mechanics are defined in:

`08-LOCATION-AND-SAFE-ZONES.md`

---

# 1. V1 Safety Scope

V1 has two primary safety workflows:

1. **Patient SOS**
2. **Safe Zone breach**

The baseline explicitly distinguishes these workflows.

V1 does not define:

- A general safety-responsibility assignment system
- A separate responder-management system
- Automatic emergency-service dispatch
- Automatic 112 calling by the system
- Sophisticated escalation chains
- Complex shift handovers
- Automatic replacement of caregivers for safety coverage

Automatic emergency dispatch is explicitly deferred.

---

# 2. Safety Permissions

Safety access is permission-controlled.

Relevant V1 permissions include:

- **Receive SOS Alerts**
- Relevant Safe Zone/geofence alert permission
- Location access where separately permitted
- Other safety permissions defined by the final permission matrix

The baseline explicitly separates:

- Location access from safety-alert receipt
- Receiving SOS alerts from responding
- Routine-management authority from other permissions

## Important Rule

Receiving a safety alert does not automatically grant:

- Location access
- Patient-care access
- Safety-setting management
- `Manage Caregiver Relationships` permission

Likewise, being able to view safety information does not automatically grant permission to change it.

---

# 3. Who Controls Safety Permissions?

The V1 permission model controls access to safety functions.

The Circle Owner holds all permissions by default. In V1, `Manage Member Permissions` is delegatable: the Owner can grant it to eligible Circle members, who can then delegate or revoke other delegatable permissions, while only the Owner can grant or revoke `Manage Member Permissions` itself or perform Owner-only operations.

Therefore:

- Circle membership alone does not grant safety permissions.
- Receiving an alert does not grant permission to modify permissions.
- Routine-management permission does not grant safety-management authority.
- `Manage Caregiver Relationships` permission does not automatically grant all safety permissions.
- Patient cannot manage Circle permissions.

The exact permission matrix for each safety operation remains an architecture/detail item where the V1 baseline has not yet specified it. The workflow must not invent that matrix.

---

# 4. Patient Safety Settings

## Actor

- Patient, where the V1 setting permits it
- Authorized user according to the applicable permission

## V1 Patient Safety Settings

The Patient interface may expose:

- GPS/location permission status
- Safe Zone status
- SOS/help settings where appropriate
- Designated emergency/familiar contact where permitted

The Patient does not manage Circle permissions.

## Rules

Viewing a safety setting does not automatically grant permission to modify it.

Each setting must use its defined authorization rule.

---

# 5. Designated Emergency / Familiar Contact

## Goal

Give the Patient an explicit person they can contact when they need help.

## Flow

1. Patient opens the appropriate safety setting.
2. System displays the designated contact.
3. Patient can use the supported contact action.
4. The contact mechanism is performed according to the supported V1 behavior.

## Rules

The designated contact is **not the same concept as an SOS alert recipient**.

A designated contact may be callable by the Patient without necessarily being a recipient of every SureStep safety alert.

The system must not imply that a designated contact has received an SOS unless they also have the appropriate alert permission.

---

# 6. Patient SOS

## Actor

- Patient

## Goal

Request immediate assistance from authorized SOS recipients.

## Flow

1. Patient selects the SOS/Help action.
2. System creates the SOS incident.
3. System sends the SOS to all users with the relevant **Receive SOS Alerts** permission.
4. Patient receives confirmation that the SOS was sent.
5. Patient has the option to call their designated contact.
6. Authorized recipients receive the active SOS alert.
7. One or more recipients may respond.
8. The alert remains active until the situation is actually resolved.
9. An authorized responder resolves the incident.
10. The complete lifecycle is recorded in audit history.

The V1 baseline explicitly defines this SOS lifecycle.

---

# 7. SOS Alert Information

An authorized SOS recipient receives the information required by V1 to respond.

The alert identifies:

- Patient
- SOS event
- Current alert state
- Relevant location information where location access is permitted
- Available response actions

The recipient must not receive unrelated Patient information merely because they received the SOS.

---

# 8. SOS Response

## Actor

- Authorized SOS recipient

## Goal

Indicate that they are responding to the Patient.

## Flow

1. Recipient opens the active SOS.
2. Recipient selects **I'm Responding**.
3. System records the responder and timestamp.
4. Alert remains visible to other authorized recipients.
5. Responder takes appropriate action.
6. Once the Patient is safe, the responder resolves the alert.

## Rules

`I'm Responding` means:

> This person has indicated that they are currently responding.

It does **not** mean:

- The Patient is safe.
- The incident is resolved.
- Other recipients should stop monitoring.
- Other recipients lose access to the alert.

The baseline explicitly requires other authorized users to remain able to see/intervene.

---

# 9. SOS Resolution

## Actor

- Authorized responder

## Goal

Confirm that the underlying SOS situation has been resolved.

## Flow

1. Responder confirms that the Patient is safe.
2. Responder selects **Resolve**.
3. System records:
   - Resolver
   - Resolution time
   - Alert state
4. SOS changes to `Resolved`.
5. The incident remains available in the appropriate history/audit trail.

## Rule

Opening or responding to an alert does not resolve it.

The final action is explicitly **Resolve**.

---

# 10. Safe Zone Breach

## Actor

- System

## Goal

Detect when a Patient leaves a configured Safe Zone and notify authorized safety recipients.

## Boundary

Safe Zone configuration and location detection are defined in:

`08-LOCATION-AND-SAFE-ZONES.md`

This workflow begins when the location system determines that a monitored Patient has breached a Safe Zone.

## Flow

1. Patient leaves a monitored Safe Zone.
2. System detects the breach.
3. System creates a Safe Zone alert.
4. Users with the relevant safety/geofence permission receive the alert.
5. Patient receives a calm/reassuring message.
6. Authorized responders can view the Patient's location on the integrated map where they have location access.
7. Responder can take an available response action.
8. Human responder resolves the alert.

The baseline explicitly requires that returning to the zone does **not** automatically resolve the incident.

---

# 11. Safe Zone Alert Response

Depending on the supported V1 UI, authorized responders may have actions including:

- **I'm Responding**
- **Call Patient**
- **Get Directions**
- **Resolve Alert**

The baseline explicitly identifies these response actions.

The availability of each action depends on the user's current permissions and available location/contact data.

---

# 12. Return to Safe Zone

If the Patient returns to the Safe Zone:

1. System records the updated location state.
2. The active alert remains unresolved.
3. Authorized responders are informed of the updated situation where applicable.
4. A human responder determines whether the incident is resolved.
5. The responder selects **Resolve** when appropriate.

```text id="f3v7kp"
Outside Safe Zone
      ↓
Breach Detected
      ↓
Alert Active
      ↓
Patient Returns
      ↓
Situation Updated
      ↓
Human Resolves
```

Returning to the zone is an **event/update**, not automatic resolution.

---

# 13. Alert vs Safety Gap

These are different concepts.

## Alert

An **alert** is an active safety incident requiring attention.

Examples:

- Patient pressed SOS.
- Patient breached a monitored Safe Zone.

An alert has a lifecycle:

```text id="q9z3pf"
Triggered
   ↓
Delivered / Active
   ↓
Viewed
   ↓
Responding (optional)
   ↓
Resolved
```

The V1 baseline defines this as the general alert lifecycle. Not every alert needs every state.

## Safety Gap

A **safety gap** would mean that a required safety responsibility has no valid person/mechanism covering it.

V1 does **not** define a separate safety-gap management feature.

Therefore V1 does not create states such as:

```text
Covered → Safety Gap → Escalation → Covered
```

and does not introduce a general feature for assigning or accepting safety responsibility.

If a caregiver relationship ends, SureStep can detect the loss of that caregiver's access and handle the consequences required by the relevant workflow, but it must **not invent a replacement-responsibility system**.

---

# 14. Help vs Emergency

Patient **Help/SOS** and an externally classified emergency are not automatically the same thing.

## Help / SOS

The Patient explicitly requests assistance.

The system:

- Creates the SOS incident.
- Notifies users with Receive SOS Alerts permission.
- Confirms the request to the Patient.
- Allows the Patient to contact the designated person.
- Allows authorized recipients to respond.

## Emergency Dispatch

V1 does **not** automatically:

- Call 112.
- Dispatch emergency services.
- Find nearby public responders.
- Automatically escalate to emergency services.

This is explicitly outside V1.

Therefore the workflow does not define an internal `Emergency` classification or an automatic emergency downgrade/escalation state.

If a human responder determines that external emergency assistance is required, that action occurs outside SureStep's automatic V1 emergency-dispatch mechanism.

---

# 15. No Automatic Escalation in V1

V1 does not implement automatic emergency escalation.

Therefore the system must not create rules such as:

> If nobody responds within 5 minutes, call the next person.

or:

> If a Safe Zone breach remains unresolved for 10 minutes, call emergency services.

Those behaviors are not defined by the V1 baseline.

The baseline explicitly marks escalation behavior as an open requirement and states that automatic emergency dispatch/escalation is not V1. 

---

# 16. Multiple Responders

Multiple authorized recipients may respond to the same alert.

## Rules

- More than one recipient can select **I'm Responding** where supported.
- One responder does not hide the incident from others.
- Other authorized users can continue to intervene.
- The alert remains active until resolved.
- Response actions are recorded.

This is an important distinction:

```text id="2b5h9w"
Responder exists
    ≠
Alert resolved
```

The baseline explicitly identifies multiple responders as a V1 edge case.

---

# 17. No Responder

If an alert is delivered but nobody responds:

- The alert remains active.
- The system does not mark it resolved.
- The system does not invent a replacement responder.
- The system does not automatically dispatch emergency services.
- The event remains visible to authorized recipients.

This is an explicit V1 alert edge case.

---

# 18. Caregiver Suspension and Safety Access

When a Professional Caregiver is suspended:

1. Their relationship-derived Patient access is blocked.
2. Their Patient assignment becomes inactive for protected care actions.
3. Any safety-alert permission they held is evaluated independently.
4. If that permission is revoked, they no longer receive or act on those alerts.
5. Existing alerts remain governed by their own lifecycle.
6. The system does not assume another caregiver has automatically taken over.

The loss of a caregiver does **not** create a new V1 safety-responsibility assignment workflow.

---

# 19. Caregiver Relationship Termination

When a caregiver relationship ends:

1. Caregiver access is revoked.
2. Patient assignment ends.
3. Any relevant safety permissions are revoked according to the relationship/permission state.
4. Existing safety incidents remain independent and auditable.
5. The former caregiver cannot perform newly protected actions through the terminated relationship.
6. The system does not claim that another person has taken over unless that actually occurs through an existing supported mechanism.

This follows the V1 requirement that relationship termination revokes appropriate Patient-data access and is auditable.

---

# 20. What Happens to an Uncovered Safety Situation?

V1 does not provide a general "care gap" management system.

Therefore:

- An alert remains active until a human resolves it.
- If no responder exists, it remains unresolved.
- The system does not fabricate coverage.
- The system does not mark an incident safe merely because the responsible caregiver disappeared.
- The system does not claim monitoring continues without an active monitoring mechanism.

If a future version introduces formal safety-responsibility coverage, it should be specified as a separate workflow rather than being silently embedded here.

---

# 21. Circle Deletion Boundary

Safe Zones belong to the **Care Circle**, not directly to the Patient.

Therefore when a Circle is deleted:

### Stops with the Circle

- Circle membership
- Circle-derived alert permissions
- Circle Safe Zones
- Circle-based Safe Zone monitoring
- Circle-based location access
- Circle-derived caregiver access

The Circle deletion workflow revokes active Circle access and does not preserve Patient/caregiver relationships as though they remained active.

### Patient-owned settings that remain

Patient account/profile data remains with the Patient.

Patient-owned settings such as:

- SOS/help availability where supported
- Designated emergency/familiar contact
- Patient-side safety preferences

do not become deleted merely because a Circle is deleted.

However, a setting remaining in the Patient account does **not** mean that an active monitoring mechanism still exists.

### No supported responder

If Circle deletion leaves no supported user with the required alert permission:

- No Circle-based alert recipient exists.
- The system must not claim that Circle-based monitoring continues.
- Patient can still see the applicable Patient-side safety state/settings.
- Any supported direct-contact mechanism remains subject to its own configuration.
- A future Circle/connection is required for Circle-based monitoring to resume.

---

# 22. Location Availability

Safety workflows must distinguish:

- Current/recent location
- Stale location
- Location unavailable

The system must never present stale or unavailable location as live location.

The V1 baseline explicitly requires these distinctions.

Detailed behavior for:

- GPS disabled
- Permission revoked
- Offline device
- Low battery
- Stale location
- False GPS movement

belongs in `08-LOCATION-AND-SAFE-ZONES.md`.

---

# 23. Alert Lifecycle

The general V1 alert model is:

```text id="4z6m3k"
Triggered
    ↓
Delivered / Active
    ↓
Viewed
    ↓
Responding (optional)
    ↓
Resolved
```

Not every alert requires every state.

Important rules:

- Viewing does not resolve.
- Responding does not resolve.
- One responder does not hide the alert from others.
- Alert remains active until the underlying situation is resolved.
- Resolution is an explicit human action.
- Important transitions are auditable.

This directly follows the V1 baseline.

---

# 24. No False-Positive State in V1 Unless Added Later

The baseline does not define a separate `False Positive` state.

Therefore V1 does not introduce one.

If a future requirement needs false-positive handling, it should define:

- Who can mark it false.
- What happens to the active alert.
- Whether the Patient/responder is notified.
- How the event is recorded.

Until then, an active alert is resolved through the defined human resolution flow.

---

# 25. Audit

Important safety events are recorded, including:

- SOS trigger
- SOS response
- SOS resolution
- Safe Zone breach
- Alert delivery where auditable
- Response actions
- Alert resolution
- Safe Zone changes
- Safety permission changes
- Patient assignment changes relevant to safety
- Caregiver relationship termination affecting safety access

The audit record is not ordinary user-editable content.

---

# 26. Failure / Edge Cases

### Alert notification fails

The alert remains an active system incident even if delivery to a particular recipient fails.

The system must not treat notification failure as resolution.

### Multiple responders

Multiple authorized recipients can respond.

The alert remains active until resolved.

### Alert opened but not resolved

Opening the alert does not change it to resolved.

### Patient returns to Safe Zone

Return updates the incident but does not automatically resolve it.

### No responder

Alert remains active.

No automatic emergency dispatch occurs.

### SOS and Safe Zone breach occur together

The system must preserve both underlying events rather than silently replacing one with the other.

The UI may present related incidents together, but their audit/event records remain distinguishable.

### Caregiver loses access during an active alert

The caregiver can no longer perform protected actions requiring the revoked authorization.

The alert itself remains active for other authorized recipients.

### Circle deleted during an active Safe Zone breach

Circle-derived monitoring and access end.

The historical incident remains auditable.

The system does not claim that monitoring continues without an active mechanism.

### Location becomes stale

The UI explicitly identifies the location as stale rather than presenting it as current.

---

# 27. Acceptance Criteria

- V1 safety consists of Patient SOS and Safe Zone breach workflows.
- SOS alerts go only to users with the relevant Receive SOS Alerts permission.
- Safe Zone alerts go to users with the relevant safety/geofence permission.
- Alert receipt is separate from location access.
- Alert receipt is separate from responding.
- Viewing an alert does not resolve it.
- `I'm Responding` does not hide the alert from other authorized users.
- Alerts remain active until a human resolves them.
- Safe Zone return does not automatically resolve an alert.
- Help/SOS is not automatically treated as an emergency-service dispatch.
- V1 does not automatically call 112 or dispatch emergency responders.
- V1 does not introduce a general safety-responsibility assignment feature.
- V1 does not introduce a separate safety-gap lifecycle.
- No responder does not equal resolved.
- Caregiver suspension/termination revokes the applicable access and does not falsely imply replacement coverage.
- Circle deletion stops Circle-derived monitoring and Safe Zone functionality.
- Patient-owned safety settings are not silently deleted with the Circle.
- The system never claims monitoring continues without an active monitoring mechanism.
- Location freshness is represented accurately.
- Important safety actions are auditable.

---

# Boundary

`07-SAFETY.md` answers:

> **“When a Patient triggers SOS or a monitored Safe Zone is breached, who receives the alert, what can they do, how does the incident remain active, and how is it actually resolved?”**

It does not define:

- Caregiver discovery → `05-CAREGIVER-DISCOVERY.md`
- Caregiver relationship lifecycle → `06-CAREGIVER-RELATIONSHIP.md`
- Safe Zone creation/editing
- GPS/location collection
- Geofence detection
- Location freshness mechanics → `08-LOCATION-AND-SAFE-ZONES.md`
- General notification infrastructure → `10-NOTIFICATIONS-AND-ACTIVITY.md`

It deliberately does **not** introduce a general safety-responsibility or care-gap-management system because the V1 baseline does not specify one.