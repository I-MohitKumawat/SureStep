# Corrections to `04-PATIENT-CARE.md`

## 3. Routine Management Authority

Routine participation and routine management are separate capabilities.

### Routine Participation

A Patient may:

- View their applicable routines.
- View the current care task.
- Confirm completion of an applicable task.
- Request Help/question when they cannot or do not want to complete the task themselves.

### Routine Management

Routine management includes:

- Create routine
- View routine configuration
- Edit routine
- Pause routine
- Resume routine
- Delete routine

These actions administer the care plan and therefore require routine-management authority.

---

# 4. Patient Routine Management Mode

SureStep supports two Patient care modes:

### Self Patient

A Self Patient manages their own care plan by default.

The Patient can perform routine CRUD operations from the Patient interface.

### Assisted Patient

An Assisted Patient does not manage their care plan by default.

Routine CRUD is managed by an authorized Family Member.

The Patient can still participate in applicable care tasks.

---

# 5. Patient Self-Management Settings

Some capabilities that are normally managed by a Family Member for an Assisted Patient may be enabled for the Patient when the Patient is capable and wants to manage them personally.

The Patient interface therefore contains a **Self-Management** section in Settings.

## Example Controls

```text
Self-Management

Routine Management
[ Enabled / Disabled ]

Other self-management capabilities
[ capability-specific controls ]
```

Each capability is independently controlled.

## Rules

### Self Patient

- Routine Management is enabled by default.
- Patient can use routine CRUD.
- Patient can disable their own routine-management capability if the product permits it.

### Assisted Patient

- Routine Management is disabled by default.
- Patient can see that routine management is controlled by their care setup.
- Patient cannot independently bypass the Assisted configuration.
- Enabling routine management for an Assisted Patient requires an authorized Family Member with appropriate authority.
- Once enabled, the Patient can perform the permitted routine-management actions directly.
- Family Members retain their existing authorized management capability.

## Important Rule

The setting changes **who may perform the action**.

It does not change whether the Patient remains classified as Self or Assisted.

Therefore:

```text
Assisted Patient
      ↓
Routine Management disabled
      ↓
Family manages routine
```

can become:

```text
Assisted Patient
      ↓
Family enables Patient Routine Management
      ↓
Patient can manage own routines
      ↓
Family retains authorized management access
```

This allows a capable Assisted Patient to gradually participate more actively without changing the underlying care mode.

---

# 6. Create Routine

## Actor

One of:

- Patient with Routine Management enabled
- Authorized Family Member
- Authorized Professional Caregiver where explicitly permitted

## Preconditions

- Patient exists.
- Actor has routine-management authority.

## Flow

1. Actor selects **Create Routine**.
2. System asks for:
   - Routine name
   - Description/instructions
   - Schedule
   - Relevant time
   - Recurrence
3. Actor enters the information.
4. System validates the configuration.
5. Actor confirms.
6. System creates the routine.
7. System generates the applicable occurrences.
8. System records creation.

## Rules

- A routine belongs to the Patient's care plan.
- Creating a routine is a management action, not a care-participation action.
- A Patient without Routine Management enabled cannot create a routine.
- Assisted Patients without the capability enabled cannot create routines.
- Routine creation does not automatically create a safety event.
- Routine creation does not automatically create a caregiver relationship.

---

# 7. Edit Routine

## Actor

Patient with Routine Management enabled or authorized care-plan manager.

## Goal

Modify a routine's configuration.

## Flow

1. Actor opens the routine.
2. Actor selects **Edit**.
3. Actor changes the configuration.
4. System validates the changes.
5. Actor confirms.
6. System determines which existing occurrences are affected.
7. System updates future scheduling.
8. System applies the defined Today's Pending Occurrence rules.
9. System records the modification.

---

# 8. Effect of Routine Changes on Today's Occurrences

Routine changes must explicitly distinguish between:

- Historical occurrences
- The current Ongoing occurrence
- Future occurrences
- Today's not-yet-started occurrences

## Rule

A routine change does **not** rewrite completed or historical occurrences.

### If Today's Occurrence Has Not Started

If the occurrence has not yet started:

- The updated routine configuration applies to that occurrence when the change is saved, where technically applicable.
- If the schedule is moved to a later time, the occurrence follows the new time.
- If the occurrence is removed by the new routine configuration, it is cancelled rather than completed or skipped.
- Historical records are unaffected.

### If Today's Occurrence Is Currently Ongoing

If the occurrence has already started:

- It remains Ongoing.
- Editing the routine does not retroactively change the fact that the care task began.
- Updated instructions apply only where the product explicitly allows the current task to refresh.
- The occurrence remains Ongoing until it is Confirmed or until the next occurrence replaces it under the overdue rule.

### If Today's Occurrence Is Already Completed

- It remains Completed.
- Editing the routine cannot rewrite its historical completion state.

### If the Routine Schedule Removes Future Occurrences

- Existing completed history remains.
- Pending future occurrences removed by the new configuration are cancelled.
- No cancelled occurrence is treated as Completed or Overdue.

---

# 9. Routine Occurrence Lifecycle

A routine occurrence represents one scheduled instance of a routine.

## States

```text
Scheduled
    ↓
Ongoing
    ↓
Completed
```

An Ongoing occurrence can additionally become:

```text
Ongoing
    ↓
Overdue
```

when its next scheduled occurrence replaces it without completion.

## State Definitions

### Scheduled

The occurrence exists but its care window has not begun.

### Ongoing

The occurrence's scheduled time has arrived and the task is currently awaiting completion.

### Completed

The Patient or authorized caregiver has confirmed that the task was completed.

### Overdue

The occurrence was not completed before the next occurrence replaced it.

---

# 10. Current Routine Replacement

This is the authoritative overdue rule.

When a routine produces the next occurrence:

1. System checks the previous occurrence.
2. If the previous occurrence is Completed, nothing changes.
3. If the previous occurrence is still Ongoing, the previous occurrence becomes Overdue.
4. The new occurrence becomes the current Scheduled occurrence.
5. When its scheduled time arrives, it becomes Ongoing.

Example:

```text
08:00 — Morning Medication
        ↓
      Ongoing

10:00 — Next scheduled occurrence arrives
        ↓
08:00 occurrence → Overdue
10:00 occurrence → Scheduled
```

If the 08:00 task was confirmed at 08:30:

```text
08:00 occurrence → Completed
10:00 occurrence → Scheduled
```

## Rules

- An Ongoing occurrence does not remain Ongoing indefinitely.
- The next occurrence establishes the boundary for determining whether the previous occurrence became overdue.
- Overdue means the previous scheduled care was not confirmed before the next occurrence replaced it.
- The underlying routine remains active.

---

# 11. No Skip State

Routine occurrences do not have a **Skipped** state in V1.

The available care actions are:

```text
Confirm
Help / Question
```

Therefore the occurrence state model is:

```text
Scheduled
    ↓
Ongoing
    ↓
Completed

Ongoing
    ↓
Overdue
```

## Rules

- Patient cannot mark a task as Skipped.
- Family/Caregiver cannot mark a task as Skipped through the standard task flow.
- If care was not completed, the system represents that through the Ongoing → Overdue lifecycle.
- If a task needs to be cancelled or removed from the care plan, the routine-management workflow handles that separately.

---

# 12. Complete Care Task

## Actor

Patient or authorized Family Member/Caregiver.

## Goal

Confirm that the current care task has been completed.

## Preconditions

- Occurrence exists.
- Actor has permission to participate in or record completion.
- Occurrence is Scheduled or Ongoing according to the applicable task rules.
- Occurrence has not already been completed.

## Flow

1. Actor opens the current care task.
2. Actor selects **Confirm**.
3. System records the completion.
4. Occurrence becomes Completed.
5. System records:
   - Completing account
   - Completion time
6. Authorized members can see the updated state.

## Rules

- Confirming a task does not modify the underlying routine.
- Completion identifies who confirmed it.
- A Completed occurrence does not become Overdue.
- Completion is a care-participation action, not a routine-management action.

## Acceptance Criteria

- Authorized Patients can confirm applicable tasks.
- Authorized Family Members/Caregivers can record completion.
- Completion persists.
- Completion actor and time are recorded.

---

# 13. Help / Question

## Actor

Patient.

## Goal

Allow the Patient to request assistance instead of independently completing a care task.

## Flow

1. Patient opens the current task.
2. Patient selects **Help / Question**.
3. System records the request.
4. System identifies the appropriate authorized recipient according to the notification workflow.
5. Relevant Family Member/Caregiver is notified.
6. Task remains unresolved until the care action is completed or otherwise handled by the authorized care workflow.

## Rules

- Help/question does not mark the task Completed.
- Help/question does not mark the task Skipped.
- The Patient is not penalized by changing the task state merely for requesting help.
- Notification behavior is defined by `10-NOTIFICATIONS-AND-ACTIVITY.md`.

---

# 14. Patient Participation vs Care-Plan Administration

These are intentionally separate.

## Patient Participation

The Patient can:

- View applicable routines.
- View current care tasks.
- Confirm applicable tasks.
- Ask for Help/question.

## Care-Plan Administration

An authorized manager can:

- Create routines.
- Edit routines.
- Pause routines.
- Resume routines.
- Delete routines.
- Change schedules.
- Change instructions.

## Default Authority

```text
Self Patient
    ├── Participate in care
    └── Manage own routines
```

```text
Assisted Patient
    ├── Participate in care
    └── Family manages routines
```

If Self-Management is explicitly enabled for the Assisted Patient:

```text
Assisted Patient
    ├── Participate in care
    └── Manage permitted routines
```

---

# 15. Pause Routine

## Actor

Patient with Routine Management enabled or authorized care-plan manager.

## Goal

Temporarily stop future occurrences without deleting historical care records.

## Flow

1. Actor selects the routine.
2. Actor selects **Pause**.
3. System confirms.
4. System pauses future scheduling.
5. Existing historical occurrences remain unchanged.
6. Current Ongoing occurrence is handled according to the Today's Pending Occurrence rules.
7. System records the pause.

## Rules

- Pausing does not delete historical completion records.
- Future occurrences are not generated while paused.
- Pausing a routine is a care-plan administration action.

---

# 16. Resume Routine

## Actor

Patient with Routine Management enabled or authorized care-plan manager.

## Flow

1. Actor opens a paused routine.
2. Actor selects **Resume**.
3. System displays the schedule that will become active.
4. Actor confirms.
5. System resumes future scheduling.
6. System records the change.

## Rules

- Resume does not rewrite historical occurrences.
- New occurrences are generated according to the active schedule.
- Resume is a care-plan administration action.

---

# 17. Delete Routine

## Actor

Patient with Routine Management enabled or authorized care-plan manager.

## Flow

1. Actor selects the routine.
2. Actor selects **Delete**.
3. System explains that future occurrences will stop.
4. Actor confirms.
5. System stops future scheduling.
6. Historical care records remain.
7. System records the deletion.

## Rules

- Deleting a routine does not delete historical completion records.
- A deleted routine cannot generate new occurrences.
- A currently Ongoing occurrence is not falsely marked Completed.
- Routine deletion is a care-plan administration action.

---

# 18. Assisted Patient Care-Plan Ownership

For an Assisted Patient:

- Family is the default administrator of the care plan.
- Patient participation remains available.
- Patient does not receive routine CRUD merely because they can complete tasks.
- A Family Member with appropriate authority may enable Patient self-management capabilities.
- Enabling a capability does not remove Family authority.
- Family can continue managing the care plan after Patient self-management is enabled.

This prevents:

```text
Patient can confirm task
        ≠
Patient can edit care plan
```

---

# 19. Routine Management Permissions

Routine management is controlled by the existing Circle permission system.

The relevant permission is:

**Manage routines**

This permission may be held by:

- Circle Owner
- Authorized Family Member
- Authorized Professional Caregiver where explicitly granted
- Patient when Self-Management is enabled for the Patient

The Patient's self-management setting is an additional Patient-side capability check.

Therefore a non-Patient member needs:

```text
Circle membership
    +
Manage routines permission
```

A Patient needs:

```text
Patient account
    +
Routine Management enabled
```

---

# 20. Routine Change Examples

### Example A — Change today's time before it starts

Original:

```text
09:00 — Scheduled
```

Family changes it to:

```text
10:00
```

Result:

```text
09:00 occurrence → remains today's pending occurrence, now scheduled for 10:00
```

It does not become overdue.

---

### Example B — Change instructions while task is Ongoing

```text
09:00 → Ongoing
```

Family changes the routine instructions at 09:15.

The existing occurrence remains Ongoing.

The system does not create a second occurrence merely because the instructions changed.

---

### Example C — Current occurrence not completed

```text
09:00 → Ongoing
```

Next occurrence:

```text
13:00 → Scheduled
```

At the transition:

```text
09:00 → Overdue
13:00 → Scheduled
```

---

### Example D — Current occurrence completed

```text
09:00 → Ongoing
09:30 → Completed
13:00 → Scheduled
```

The 09:00 occurrence remains Completed permanently.

---

### Example E — Routine deleted while today's task is pending

```text
09:00 → Ongoing
```

Routine is deleted at 09:15.

The system stops future occurrences.

The existing occurrence is not falsely marked Completed.

Its final handling follows the defined care-record rules rather than inventing a Skip state.

---

# 21. Care State Model

```text
Patient
   ↓
Care Plan
   ├── Routines
   │      ↓
   │   Occurrences
   │      ├── Scheduled
   │      ├── Ongoing
   │      ├── Completed
   │      └── Overdue
   │
   ├── Medication Information
   │
   └── Care Instructions
```

The important distinction is:

```text
CARE PARTICIPATION
    Confirm
    Help / Question

        vs.

CARE-PLAN MANAGEMENT
    Create
    Edit
    Pause
    Resume
    Delete
```

---

# 22. Boundary With Safety

Routine failure and safety incidents remain different concepts.

```text
Care task not confirmed
        ↓
Ongoing
        ↓
Next occurrence replaces it
        ↓
Overdue
```

does not automatically mean:

```text
Emergency
```

Safety incidents are handled by `07-SAFETY.md`.

---

# 23. Boundary With Notifications

Patient Care determines the event:

- Routine scheduled
- Routine becomes Ongoing
- Routine completed
- Routine becomes Overdue
- Help/question requested
- Routine changed

`10-NOTIFICATIONS-AND-ACTIVITY.md` determines:

- Who receives the notification
- Which notification is generated
- Delivery behavior
- Notification preferences
- Notification state

Patient Care must not independently define notification delivery behavior.

---

# 24. Patient Home Experience

## Actor

Patient.

## Goal

Provide a calm, orienting, and accessible daily home experience centered on the Patient's immediate needs.

## Visual Hierarchy and Priority Order

The Patient Home screen organizes information in strict priority order:

1. **Orientation:**
   - Current day of the week, date, and general time of day (e.g., Morning, Afternoon, Evening).
   - Clear, uncluttered presentation to prevent cognitive overload.
2. **Today's Routine:**
   - Prominent presentation of the current ongoing task.
   - Immediate access to confirm completion or ask for help.
   - Scrollable nearby tasks (upcoming and completed).
3. **Safety / Help (SOS):**
   - High-visibility, calm SOS / Help emergency action.
   - Dedicated access to contact designated emergency helpers.
4. **Familiar Content:**
   - Direct access to My People and familiar photos, short videos, and text memories (`09-MEMORIES-AND-ACTIVITIES.md`).

## Rules

- **Simplicity and Dignity:** The Patient Home must remain free of administrative Care Circle mechanics, billing, permission management, or complex settings.
- **Participation Focus:** Patient interacts through simple confirmation and Help/Question requests; no punitive overdue warnings or clinical diagnostic scoring.
- **Safety Integration:** SOS trigger navigates into the safety flow (`07-SAFETY.md`).
- **Permission Respect:** If an Assisted Patient does not have routine management enabled, administrative CRUD controls remain completely hidden.

---

# 25. Family Dashboard and Multi-Patient Context Switching

## Actor

Family Member.

## Goal

Monitor and coordinate care across all authorized Patients within the active Care Circle.

## Presentation and Content

The Family Dashboard presents:

- **Authorized Patients:** Displays all Patients the Family Member is explicitly authorized to view/manage within the active Care Circle.
- **Active Patient Context:** If multiple Patients are available, one Patient is designated as the active context, clearly displayed with Patient name and photo.
- **Patient Status Summary:**
  - Daily routine progress (completed, ongoing, upcoming, overdue tasks).
  - Relevant care updates and recent notes.
  - Active safety status (Safe Zone state, active safety alerts).
  - Patient location and freshness (only if the user holds explicit `View patient location` permission; otherwise location is omitted).
- **Quick Actions:** Quick links to Care Profile, Routines, Memories, Safety Alerts, and Caregiver Management.

## Multi-Patient Context Switching

When a Family Member has access to multiple Patients within the Care Circle:

1. Family Member selects the Patient switcher control.
2. System displays eligible Patients authorized for this user.
3. Family Member selects the target Patient.
4. System executes an atomic context switch:
   - Flushes all cached data for the previous Patient.
   - Loads the target Patient's care plan, safety status, and authorized permissions.
   - Updates the interface banner and header to prominently display the target Patient's name and identity.

---

# 26. Professional Caregiver Home Experience

## Actor

Professional Caregiver.

## Goal

Provide a focused care dashboard displaying only assigned Patients and permitted daily care actions.

## Presentation and Content

The Professional Caregiver Home presents:

- **Single Patient Assignment:** If the caregiver has exactly one assigned Patient, the caregiver home defaults directly to that Patient's daily care dashboard.
- **Multiple Patient Assignments:** If the caregiver is assigned to multiple Patients within their single active Care Circle, the home presents a Patient card list displaying only assigned Patients.
- **Patient Card Information:**
  - Patient name and photo.
  - Current ongoing task and upcoming care routine.
  - Active safety alerts relevant to the caregiver.
  - Patient location and freshness (only if caregiver holds explicit location permission).
  - Quick action buttons: Routine execution, Alert response, Location view, Patient care details.

## Rules

- **Strict Assignment Scoping:** A Professional Caregiver sees **only** Patients currently assigned to them with an active caregiver relationship (or active notice period).
- **No Circle-Wide Exposure:** Caregivers must never see unassigned Patients merely because those Patients belong to the same Care Circle.
- **Execution-Oriented:** Displays tasks for execution; administrative routine management controls are shown only if explicitly delegated.
- **Single Active Circle:** In V1, caregivers operate within one active Circle.

---

# 27. Wrong-Patient Prevention Framework

Care delivery errors across multiple Patients can create serious clinical and safety hazards. SureStep enforces a mandatory wrong-Patient prevention framework across all clients and backend services:

## Rules

1. **Explicit Target Identification:**
   - Every Patient-specific screen, modal, card, and consequential action dialog must prominently display the target Patient's name and visual identifier.
2. **Atomic Context Refresh:**
   - Switching the active Patient must completely invalidate and refresh all Patient-specific view models, cached state, form inputs, and controls.
   - Stale data from Patient A must never be presented or submitted under Patient B's context.
3. **Independent Operation Reauthorization:**
   - Every protected operation (routine completion, routine edit, location query, permission check) must re-evaluate authorization against the actual target Patient ID submitted in the request payload.
   - Backend services must never assume authorization based on a previously selected Patient or cached session state.
4. **Revoked Assignment and Unavailable Patient Handling:**
   - If an assignment or relationship is revoked while a caregiver or family member is viewing a Patient, the next operation is denied immediately, the screen transitions to an unavailable state, and the user is redirected to the home dashboard.
5. **Context Switch Failure Fallback:**
   - If a network or authorization failure occurs during Patient context switching, the system must abort the switch cleanly, display an error message, and avoid displaying a partial or mixed-context interface.

---

# 28. Acceptance Criteria for Home Experiences and Context Management

- Patient Home prioritizes orientation, today's routine, SOS/help, and familiar content, in that exact order.
- Patient Home remains simple, calm, and free of administrative Circle and billing controls.
- Family Dashboard displays all Patients the Family Member is authorized to manage within the active Care Circle.
- Active Patient context is always explicitly indicated in multi-Patient views.
- Location is shown on Family and Caregiver dashboards only when explicit location permission is held.
- Caregiver Home displays only assigned Patients with active relationships or active notice periods; unassigned Circle Patients are never shown.
- Patient context switching refreshes all Patient-specific data and invalidates cached state.
- Every protected operation reauthorizes the target Patient independently on the server.
- Revocation of assignment or permission immediately invalidates active dashboard access upon the next action.
- Wrong-Patient actions are prevented across all dashboards.