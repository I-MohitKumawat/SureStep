# Workflow: Notifications and Activity

## Purpose

Provide users with timely information about events that require their attention and provide a user-facing history of relevant activity.

This workflow does not define backend audit logging. User-facing Activity and immutable system audit records are separate concerns.

---

# 1. Notification Delivery

## Actor

System.

## Goal

Notify a user when an event occurs that they are authorized or intended to know about.

## Preconditions

- A system event has occurred.
- The event has a defined notification recipient.
- The recipient has an active account/session or otherwise has a supported notification channel.

## Flow

1. A workflow produces an event that requires notification.
2. The system determines the intended recipient(s) from the permission/relationship rules of that workflow.
3. The system creates a notification for each eligible recipient.
4. The notification contains enough information to understand the event and take the supported action.
5. The recipient can open the notification and navigate to the relevant feature/context.
6. The notification becomes read when the user opens/acknowledges it according to the product UI behavior.

## Rules

- Notification eligibility comes from the underlying workflow's authorization rules.
- Being a Circle member does not automatically make a user a recipient of every notification.
- Being a caregiver does not automatically make a user a recipient of every notification.
- Location access does not automatically grant safety-alert notification access.
- Receiving SOS alerts does not automatically grant location access.
- Notification access must not grant access to data that the recipient is otherwise unauthorized to view.
- A notification must not expose protected Patient information beyond what the recipient is authorized to receive.
- Revoked access must prevent future protected notifications from being delivered to that user.
- Notifications do not themselves grant permissions.

---

# 2. Notification Types Defined in V1

Only notification types established by the V1 workflows are included.

### Safety

- Patient SOS alert
- Safe Zone breach alert

Safety notification recipients are determined by the permissions defined in the Safety workflow.

### Care Circle

- Circle invitation / invitation-related status
- Join request requiring the relevant member's action
- Membership acceptance/rejection where applicable
- Membership removal or departure where the affected user needs to know

### Caregiver Relationship

- Caregiver interest/request
- Family confirmation requiring action
- Caregiver relationship establishment
- Relationship suspension
- Relationship termination

### Care

- Routine-related information where the product requires the relevant authorized user to be informed
- Patient Help/Question requests where a recipient is defined by the care workflow

### Memories and Activities

V1 does not require a general notification for every memory, activity, or game event.

Memory and activity events may be recorded as history without generating notifications unless a separate workflow explicitly defines a notification.

---

# 3. Safety Notifications

## Actor

System.

## Goal

Notify authorized recipients when a V1 safety event occurs.

## Flow

### SOS

1. Patient activates SOS.
2. System creates an SOS alert.
3. System identifies users with the Receive SOS Alerts permission.
4. Those users receive the SOS notification.
5. Patient sees confirmation that the SOS was created.
6. Recipients can open the alert and perform supported response actions.

### Safe Zone Breach

1. Location monitoring detects that a monitored Patient has left an active Safe Zone.
2. System creates a Safe Zone breach alert.
3. System identifies users authorized to receive the relevant Safe Zone alert.
4. Those users receive the notification.
5. Patient receives the defined calm/reassuring message.
6. Authorized responders can open the alert and access location information only if they also have the required location access.
7. Returning to the Safe Zone does not automatically resolve the alert.

## Rules

- Notification recipients are permission-based.
- A notification recipient may not automatically be a responder.
- A responder may not automatically have location access.
- The notification itself must not expose live location to a user who lacks location permission.
- Safety alerts remain governed by the Safety workflow after notification delivery.

---

# 4. Routine and Care Notifications

## Actor

System.

## Goal

Provide relevant users with information about care events where the V1 care workflow requires notification.

## Flow

1. A routine or care event occurs.
2. System determines whether that event has a defined notification behavior.
3. If notification is required, the system identifies the authorized recipient.
4. The recipient receives the notification.
5. Opening the notification takes the user to the relevant care context.
6. Any resulting action is authorized using the underlying care permissions.

## Rules

- Routine management permission does not automatically mean the user receives every routine notification.
- A Patient participating in a routine does not automatically notify every Family Member or caregiver.
- Help/Question is a request for assistance and must not be treated as completion of the routine.
- Notifications must reflect the current routine/care state rather than granting or changing that state.

---

# 5. Care Circle Notifications

## Actor

System.

## Goal

Keep users informed about Circle actions that affect their membership or require their participation.

## Flow

1. A Circle invitation, join request, membership decision, membership removal, departure, ownership change, or other defined Circle event occurs.
2. System identifies the affected or action-required user.
3. System creates the appropriate notification.
4. User opens the notification.
5. The user is taken to the relevant Circle context.
6. Any resulting action is checked against current Circle permissions.

## Rules

- Circle notifications do not bypass Circle authorization.
- A user whose membership has been revoked must not retain functional Circle access merely because an old notification remains visible.
- A notification for a pending request does not itself approve the request.
- An invitation notification does not itself create Circle membership.

---

# 6. Caregiver Relationship Notifications

## Actor

System.

## Goal

Inform users about changes in the caregiver relationship lifecycle.

## Flow

1. A caregiver interest/request or relationship state change occurs.
2. System identifies the affected user(s) according to the caregiver workflow.
3. Notification is created where that workflow requires user notification.
4. User opens the notification.
5. The user sees the current relationship state.
6. Any available action is checked against the user's current relationship and Circle permissions.

## Rules

- Caregiver interest is not an active caregiver relationship.
- A notification about caregiver acceptance/interest does not establish the relationship.
- Relationship establishment does not automatically create Patient assignment.
- Relationship termination immediately affects protected access even if an earlier notification remains visible.

---

# 7. Notification State

Each notification has an independent lifecycle:

`Created → Delivered → Read`

A notification may also become:

`Created → Failed`

when the selected delivery mechanism cannot deliver it.

## Rules

- Notification state does not represent the state of the underlying event.
- Reading an SOS notification does not resolve the SOS.
- Reading a Safe Zone notification does not resolve the alert.
- Reading a caregiver request does not accept it.
- Reading a Circle invitation does not join the Circle.
- Notification failure does not silently change the underlying workflow state.

---

# 8. Notification History

## Actor

User.

## Goal

Review notifications that were previously generated for them.

## Flow

1. User opens Notifications.
2. System displays notifications available to that account.
3. User can identify unread notifications.
4. User opens a notification.
5. System displays the relevant information permitted to that user.
6. User can navigate to the underlying feature where supported.

## Rules

- Notification history is account-specific.
- Historical notification visibility must respect current access rules.
- **Authorization Re-check:** When a historical notification is opened, the system rechecks current authorization against the referenced Patient and data entity.
- **Protection After Revocation:** After a user's access has been revoked (e.g., removal from Circle, caregiver relationship termination, or permission revocation), opening a historical notification must **not** expose protected Patient details (such as live location, routine notes, clinical details, or incident context).
- **Generic Unavailable State:** If the user no longer possesses the required permission, the system displays a generic unavailable message (e.g., "Content unavailable: access permission is no longer active") instead of the protected content.
- **Separation of Retention vs Viewing:** Preserving notification history does not grant or imply permission to view the referenced Patient data.
- **Underlying State Invariance:** Opening or reading a historical notification never resolves or alters the state of the underlying event or safety alert.
- Notification history does not replace the underlying entity's immutable audit record.

---

# 9. User-Facing Activity

## Actor

User.

## Goal

See relevant activity that helps the user understand what has happened within their care context.

## Flow

1. User opens Activity.
2. System retrieves activity events the user is authorized to see.
3. Events are displayed chronologically.
4. User can open an event where a relevant feature provides additional context.

## Rules

- Activity visibility is permission-based.
- Activity is not the same as notification history.
- Activity is not the same as the immutable backend audit log.
- Activity must not expose Patient information to users who are not authorized to view it.
- An event appearing in Activity does not grant permission to perform the corresponding action.
- Activity should preserve meaningful historical context even when the current relationship has subsequently changed, subject to the product's data-retention rules.

---

# 10. Relationship Between Activity, Notifications, and Audit

These are three separate concepts.

### Notification

**Purpose:** tell a user that something requires attention or has happened.

Example:

> Safe Zone breach detected.

### Activity

**Purpose:** provide a user-facing history of relevant events.

Example:

> Safe Zone breach detected — 10:42 AM.

### Audit Record

**Purpose:** provide an authoritative backend record of important system actions and state changes.

Example:

> User X triggered Safe Zone alert for Patient Y at timestamp Z.

One event may produce all three, only some of them, or only an audit record depending on the underlying workflow.

---

# 11. Access Revocation

## Actor

System.

## Goal

Ensure notification and activity systems do not bypass authorization changes.

## Flow

1. A user's Circle membership, caregiver relationship, permission, or other access right changes.
2. System immediately applies the new authorization state.
3. Future protected notifications use the new authorization state.
4. Opening an existing notification or Activity entry performs the appropriate current-access check.
5. Unauthorized protected content is not exposed.

## Rules

- Active sessions do not preserve revoked authorization.
- Notification history cannot be used to regain revoked access.
- When access has been revoked, opening a historical notification displays a generic unavailable message rather than exposing protected Patient details.
- Retaining a notification in user history is strictly separated from permission to view the referenced Patient data.
- Activity history cannot be used to regain revoked access.
- Existing safety alerts remain governed by the Safety workflow even when a recipient's permissions change.
- No notification workflow automatically transfers responsibility to another user.

---

# 12. Failure and Edge Cases

### Notification delivery fails

The underlying event remains unchanged.

Example:

- SOS remains active even if a recipient's notification fails.

### User loses authorization after notification

The user may still have a historical notification record, but opening it rechecks authorization and displays a generic unavailable message instead of protected Patient details.

### User receives duplicate delivery

The system should avoid creating duplicate logical notifications for the same event/recipient unless the underlying workflow explicitly requires another notification.

### Multiple recipients

Each recipient has an independent notification state.

One recipient reading or responding to a notification does not automatically mark it read for other recipients.

### Notification recipient becomes unavailable

The system does not automatically invent a replacement recipient or transfer responsibility unless the relevant workflow explicitly defines such behavior.

---

# 13. Acceptance Criteria

- Notifications are generated only for defined V1 events.
- Notification recipients are determined by the underlying workflow and permissions.
- Circle membership alone does not produce unrestricted notifications.
- Safety notification access and location access remain separate.
- Reading a notification never changes the underlying event state unless the underlying workflow explicitly defines that action.
- SOS and Safe Zone alerts remain active until resolved according to the Safety workflow.
- Revoked permissions immediately affect protected notification/activity access.
- Notification history cannot bypass authorization.
- Opening a historical notification rechecks authorization against current permissions; if access is revoked, a generic unavailable message is shown instead of protected details.
- Notification retention is separated from permission to view referenced Patient data.
- User-facing Activity is separate from backend audit records.
- Activity visibility is permission-controlled.
- Notification failure does not alter the underlying event.
- V1 does not introduce automatic escalation, emergency dispatch, automatic 112 calling, or automatic safety handover.
- V1 does not require notifications for every activity/game/memory event.