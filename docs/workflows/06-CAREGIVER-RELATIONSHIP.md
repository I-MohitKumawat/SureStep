# Workflow: Caregiver Relationship

## Purpose

Define how a Professional Caregiver moves from an accepted caregiver opportunity to a formal relationship with a Patient, receives the permissions required for assigned care, performs permitted care activities, and eventually has the relationship suspended or terminated.

This workflow begins after caregiver discovery and initial interest.

A caregiver's initial acceptance expresses **interest or availability**. It does not constitute final hiring or an active caregiver relationship.

---

# 1. Relationship Preconditions

A caregiver relationship can proceed only when:

- The caregiver is a Professional Caregiver.
- The caregiver has expressed interest in the initial request.
- The authorized Family-side decision-maker has confirmed proceeding.
- The target Patient is identified.
- The relevant Care Circle exists.
- The caregiver has joined the relevant Care Circle.
- The Patient remains associated with the Circle.
- The authorized Family Member holds the canonical `Manage Caregiver Relationships` permission.

The system must revalidate these conditions when the relationship is established.

---

# 2. Relationship Lifecycle

The relationship lifecycle is:

```text
Caregiver Interest
        ↓
Family Confirmation
        ↓
Circle Joining
        ↓
Relationship Established
        ↓
Active
   ↓ ↖
Suspended ──→ Active
   ↓          ↓ (Caregiver-initiated departure)
   |     Notice Period (7 days)
   ↓          ↓ (7-day expiry / Immediate Family action / Safety exception)
Terminated
```

Patient assignment is a **separate lifecycle associated with an Active relationship**.

It is not a prerequisite for the relationship itself to become Active.

During a `Notice Period`, the relationship remains active and existing care permissions remain in effect until the 7 days elapse or immediate termination occurs.

Therefore:

```text
Active Relationship / Notice Period
        ↓
Patient Assignment
        ↓
Care Permissions / Care Access
```

This removes the circular dependency.

---

# 3. Begin Caregiver Relationship Process

## Actor

- System
- Authorized Family Member

## Goal

Move an interested caregiver into the formal relationship process.

## Flow

1. Caregiver expresses interest.
2. Authorized Family Member reviews the caregiver.
3. Family Member confirms proceeding.
4. System creates the next-stage caregiver relationship record.
5. System identifies the Patient and Care Circle.
6. System provides the caregiver with the required Circle invitation.
7. Caregiver is instructed to join the Circle.

## Rules

At this stage:

- Caregiver is not yet assigned to the Patient.
- Caregiver does not have active Patient-care access.
- Caregiver must join the Care Circle.
- Relationship state and Circle membership state remain separate.

---

# 4. Caregiver Joins Care Circle

## Actor

- Professional Caregiver

## Flow

1. Caregiver receives the Circle invitation.
2. Caregiver opens the invitation.
3. Caregiver authenticates with their own account.
4. System displays the information permitted before joining.
5. Caregiver confirms joining.
6. System creates Circle membership.
7. System records the membership.
8. Relationship establishment can proceed.

## Rules

- Caregiver uses their own Professional Caregiver account.
- Caregiver does not use the Patient's account.
- Circle membership follows the standard Care Circle workflow.
- Circle membership does not automatically assign the caregiver to a Patient.
- Circle membership does not automatically grant unrestricted Patient access.

---

# 5. Establish Caregiver Relationship

## Actor

- Circle Owner, or
- Circle member holding the canonical `Manage Caregiver Relationships` permission

## Preconditions

- Caregiver has expressed interest.
- Family-side confirmation exists.
- Caregiver has joined the relevant Circle.
- Patient remains associated with the Circle.
- Actor has the `Manage Caregiver Relationships` permission.

## Flow

1. System verifies the caregiver's Circle membership.
2. System verifies the Patient's Circle association.
3. System verifies that the required Family-side confirmation remains valid.
4. Authorized actor confirms relationship establishment.
5. System creates the formal Patient–Caregiver relationship.
6. Relationship state becomes `Active`.
7. System records:
   - Patient
   - Professional Caregiver
   - Care Circle
   - Establishing actor
   - Creation timestamp
   - Relationship state
8. Relevant parties are notified.

## Important Rule

`Active` means:

> A formal caregiver relationship between this Professional Caregiver and this Patient has been established.

It does **not** mean:

- caregiver is assigned to every care responsibility;
- caregiver has every Patient permission;
- caregiver has unrestricted Patient access;
- a particular care task has been assigned.

Assignment and access are subsequent authorization steps.

---

# 6. Assign Caregiver to Patient

## Actor

A Circle member who holds the canonical `Manage Caregiver Relationships` permission required to manage Patient-caregiver relationships.

This authority is distinct from:

- Circle membership alone
- Routine-management permission
- General care participation

## Preconditions

- Caregiver is a Circle member.
- Patient belongs to the Circle.
- Caregiver relationship is Active.
- Actor has the `Manage Caregiver Relationships` permission.

## Flow

1. Authorized actor opens Patient caregiver management.
2. System displays eligible Professional Caregivers with Active relationships.
3. Actor selects a caregiver.
4. System displays the assignment confirmation.
5. Actor confirms.
6. System creates the Patient-caregiver assignment.
7. System records the assignment.
8. Caregiver and relevant parties are notified.

## Rules

- Circle membership alone is insufficient.
- Routine-management permission alone is insufficient.
- An Active caregiver relationship is required.
- Assignment is Patient-specific.
- Assignment does not automatically grant every Patient permission.
- A caregiver may be assigned to multiple Patients within the same Circle when separately authorized.

---

# 7. Relationship, Assignment, and Access Are Separate

SureStep maintains four distinct concepts:

### Circle Membership

> The caregiver belongs to the Circle.

### Caregiver Relationship

> The caregiver has a formal relationship with the Patient.

### Patient Assignment

> The caregiver is explicitly assigned to provide care for the Patient.

### Care Permission

> The caregiver is allowed to perform a particular care action.

These must not be collapsed.

For example:

```text
Circle Member
    ≠
Active Caregiver Relationship
    ≠
Patient Assignment
    ≠
Every Care Permission
```

---

# 8. Grant Care Permissions

## Actor

Circle Owner or a Circle member holding the canonical `Manage Caregiver Relationships` permission.

## Goal

Give the caregiver only the access required for their assigned responsibilities.

## Preconditions

- Active caregiver relationship exists.
- Relevant Patient assignment exists where the permission requires assignment.
- Granting actor has the `Manage Caregiver Relationships` permission.

## Flow

1. Authorized actor opens caregiver permissions.
2. System displays permissions that may be granted.
3. Actor selects the permitted capabilities.
4. System confirms the change.
5. System records the permission change.
6. Access is updated immediately.

## Rules

Caregiver access is:

- Patient-specific where required.
- Circle-specific.
- Permission-specific.
- Immediately revocable.

A caregiver must not receive unrestricted Patient access merely because the relationship is Active.

---

# 9. Caregiver Performing Care

## Actor

- Professional Caregiver

## Flow

1. Caregiver opens an assigned Patient.
2. System verifies current:
   - Authentication
   - Circle membership
   - Active caregiver relationship
   - Patient assignment
   - Required permission
3. System displays permitted information.
4. Caregiver performs an allowed action.
5. System records the action under the caregiver's identity.
6. Relevant notifications are generated according to the notification workflow.

## Rule

Caregiver actions are performed under the caregiver's own account.

The caregiver must never impersonate the Patient or another Circle member.

---

# 10. Who Can Manage Caregiver Relationships?

Caregiver relationship administration is a distinct authority.

The following **do not automatically grant relationship-management authority**:

- Being a Circle member
- Being the Circle Owner
- Having `Manage routines`
- Being a Professional Caregiver
- Being assigned to the Patient

The canonical `Manage Caregiver Relationships` permission is granted and revoked according to the existing Circle permission model.

## Permission Boundary

The authority to manage caregiver relationships must be explicitly represented as the `Manage Caregiver Relationships` permission.

It controls actions such as:

- Establishing a caregiver relationship
- Assigning caregivers to Patients
- Suspending a relationship
- Restoring a relationship
- Terminating a relationship

The permission must not be inferred from routine-management authority.

## Owner Rule

The Circle Owner retains the authority defined by the Circle permission model and may delegate the `Manage Caregiver Relationships` permission where that permission is delegatable.

A delegated member holding `Manage Caregiver Relationships`:

- May perform the caregiver-management actions covered by the delegated permission.
- Cannot grant themselves Owner authority.
- Cannot transfer Circle ownership unless separately authorized under the Owner-only rules.
- Cannot delete the Circle unless separately authorized under the Owner-only rules.

---

# 11. Suspend Caregiver Relationship

## Actor

- Circle Owner, or
- Circle member explicitly granted the `Manage Caregiver Relationships` permission

## Goal

Temporarily stop the caregiver relationship without permanently ending its historical existence.

## Flow

1. Authorized actor selects **Suspend Relationship**.
2. System displays the consequences.
3. Actor confirms.
4. Relationship changes from `Active` to `Suspended`.
5. Patient assignments associated with the relationship are made inactive.
6. Relationship-derived care access is immediately blocked.
7. Existing protected operations are denied on their next authorization check.
8. Relevant parties are notified.
9. System records the suspension.

## State

```text
Active → Suspended
```

## Rules

A suspended caregiver:

- Remains historically associated with the Patient.
- Cannot perform protected Patient-care actions.
- Cannot bypass suspension through an existing session.
- Cannot perform assigned care until restored.

Suspension does not itself resolve any care gap created by the loss of the caregiver.

---

# 12. Restore Caregiver Relationship

## Actor

- Circle Owner, or
- Circle member explicitly granted the `Manage Caregiver Relationships` permission

## Preconditions

- Relationship is Suspended.
- Required Circle membership still exists.
- Patient remains associated with the Circle.
- Required authorization conditions remain valid.

## Flow

1. Authorized actor reviews the suspended relationship.
2. Actor selects **Restore Relationship**.
3. System verifies the required conditions.
4. Relationship returns to `Active`.
5. Previously active assignments may be restored only if the relevant assignment state is still valid.
6. Required permissions are restored only according to their current permission configuration.
7. Caregiver is notified.

## Rule

Restoring a relationship does not automatically recreate permissions that were independently revoked while the relationship was suspended.

---

# 13. Terminate Caregiver Relationship (Family-Initiated)

## Actor

- Circle Owner, or
- Circle member explicitly granted the canonical `Manage Caregiver Relationships` permission.

## Goal

Permanently end the caregiver relationship immediately, subject to existing safety-termination rules.

## Flow

1. Authorized actor selects **End Caregiver Relationship**.
2. System displays a clear confirmation explaining that the caregiver will no longer be linked to the Patient for active care.
3. System permits immediate termination whether the relationship is currently in an `Active` state or in an ongoing `Notice Period`.
4. Actor confirms.
5. Relationship changes immediately to `Terminated`.
6. Patient assignment is ended.
7. Relationship-derived permissions are revoked immediately.
8. Existing sessions can no longer perform newly protected Patient-care actions.
9. Relevant parties (including the caregiver and Circle members) are notified.
10. Historical relationship and care records are retained according to the data lifecycle.
11. If the termination creates an active safety-critical care gap, the situation is handled by the Safety workflow (`07-SAFETY.md`).

## State

```text
Active / Notice Period → Terminated
```

A terminated relationship cannot return to Active.

A new relationship must be established if the caregiver is later engaged again.

---

# 14. Relationship Ending vs Care-Gap Handling

Ending a caregiver relationship and handling the resulting care gap are **separate operations**.

### Relationship termination does

- End the caregiver relationship.
- End the caregiver's Patient assignment.
- Revoke relationship-derived access.
- Prevent further protected care actions.
- Record the lifecycle event.
- Notify relevant parties.

### Relationship termination does not automatically guarantee

- Another caregiver is available.
- A replacement caregiver has accepted.
- A safety-monitoring responsibility has been transferred.
- A routine has been reassigned.
- A Patient is continuously monitored.
- An emergency contact has taken over.

The system must not represent any of those conditions as true unless they have actually been established.

---

# 15. Safety-Critical Care Gap

If termination, suspension, or departure affects an active safety-critical responsibility, the system must explicitly hand the situation to the Safety workflow.

The Safety workflow determines:

- Whether a safety responsibility is currently uncovered.
- Whether an existing backup person is available.
- Whether another caregiver must be assigned.
- Whether monitoring must be transferred.
- Whether an escalation is required.

A terminated caregiver must **not** continue to be treated as responsible merely because no replacement exists.

Likewise, recording a termination does not mean that the Patient is automatically safe.

The system must distinguish:

```text
Caregiver Responsibility Ended
        ≠
Replacement Responsibility Established
```

and:

```text
Access Revoked
        ≠
Care Gap Resolved
```

---

# 16. Caregiver-Initiated Termination and Notice Period

## Actor

- Professional Caregiver

## Goal

Initiate departure and end their own caregiver relationship with the Patient.

## Flow

1. Caregiver selects **End Care Relationship** (voluntary departure).
2. Caregiver provides a category/reason if appropriate.
3. **Safety exception check:**
   - If continuing care creates an immediate personal or safety risk, the caregiver can request an immediate termination or suspension, bypassing the normal notice period.
   - Upon confirmation, relationship immediately becomes `Terminated` and access is revoked.
4. **Standard Notice Period entry:**
   - In the absence of an immediate safety exception, the relationship transitions from `Active` to `Notice Period`.
   - The notice period lasts exactly seven (7) days.
5. System computes and records the effective termination timestamp (7 days from initiation).
6. System immediately notifies the Family (Circle Owner and members holding `Manage Caregiver Relationships`) of the notice, reason, and effective termination date.
7. **During the 7-day Notice Period:**
   - The relationship remains active.
   - Existing Patient assignment and care permissions remain in full effect.
   - The caregiver continues to perform authorized care tasks.
   - The Family may elect to terminate the relationship immediately at any point during the notice period (following Section 13).
   - The notice period gives the family time to arrange replacement care, but does **not** guarantee replacement care or a safety handover.
8. **Automatic termination at 7 days:**
   - At the conclusion of seven days, if not already terminated earlier by the Family or a safety exception:
   - System automatically transitions the relationship from `Notice Period` to `Terminated`.
   - Patient assignment ends automatically.
   - Relationship-derived permissions and access are revoked immediately.
   - Existing sessions can no longer perform protected Patient-care operations.
9. **Audit trail:**
   - System records the notice initiation, category/reason, notification to the Family, effective termination date, and the final automatic lifecycle transition at 7 days.
10. If the departure creates an active safety-critical care gap, the Safety workflow (`07-SAFETY.md`) is triggered.

## State Transitions

```text
Active ──(Caregiver initiates notice)──→ Notice Period (7 days)
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ↓                                               ↓
           (7 days expire automatically)                 (Family terminates immediately)
                      ↓                                               ↓
                  Terminated                                      Terminated
```

## Rules

The caregiver's voluntary departure and notice period do not:

- Delete the Patient.
- Delete the Care Circle.
- Delete Patient-owned data.
- Remove unrelated Circle members.
- Automatically create a replacement caregiver.
- Guarantee that replacement care or safety handover has occurred.

---

# 17. Patient/Circle Lifecycle Effects

## Patient Removed From Circle

If a Patient is removed from a Circle:

1. Affected caregiver relationships are identified.
2. Those relationships are ended through the required relationship lifecycle.
3. Patient assignments are ended.
4. Relationship-derived access is revoked.
5. Safety consequences are evaluated separately.
6. Affected caregivers and relevant Circle members are notified.

## Circle Deleted

When a Circle is deleted:

- Active caregiver relationships belonging to the Circle are terminated.
- Patient assignments are ended.
- Relationship-derived permissions are revoked.
- Caregiver access derived from the Circle is removed.
- Safety consequences are handled by the Safety workflow.
- Historical relationship records remain according to the data lifecycle.

Patient accounts and Patient-owned data are not deleted merely because the Circle is deleted.

---

# 18. Caregiver Account Becomes Unavailable

If a Professional Caregiver account becomes disabled or deleted:

- Protected caregiver access is revoked.
- Patient assignments are ended or made inactive.
- The caregiver relationship is ended according to the account lifecycle.
- Relevant parties are notified.
- Safety consequences are evaluated separately.
- Historical care records remain attributable to the caregiver.

---

# 19. Prevent Duplicate Relationships

For a given:

- Patient
- Professional Caregiver
- Care Circle

there may be only one Active caregiver relationship.

The system must prevent creation of a second Active relationship representing the same relationship.

If an Active relationship already exists, the user is shown the existing relationship instead.

---

# 20. Caregiver Reporting

## Actor

- Patient
- Family Member
- Professional Caregiver
(where the user has a relevant authenticated account or care relationship)

## Goal

Submit a formal report regarding a Professional Caregiver to SureStep for platform review.

## Supported Categories

A report must specify one of the following platform-supported categories:

- Inappropriate behavior
- Safety concerns
- Harassment
- Fraud
- No-show
- Payment disputes
- Serious care disputes

## Flow

1. User accesses the caregiver reporting function from the caregiver profile, relationship management, or care incident context.
2. User selects the applicable report category.
3. User enters an optional detailed description of the incident or concern.
4. User attaches optional supporting evidence where supported by the platform interface.
5. User confirms and submits the report.
6. System assigns the initial status `Submitted`.
7. System transmits the report securely to SureStep for platform review.
8. Submitting user receives confirmation of report receipt.
9. System tracks review progress through the report lifecycle:
   ```text
   Submitted → Under Review → Resolved
   ```
10. System records review status updates and the final review outcome in the immutable audit trail.

## Rules

- **Platform review:** Reports are routed to SureStep for platform evaluation.
- **No automatic termination:** Submitting a report does **not** automatically terminate, suspend, or modify an active caregiver relationship, nor does it automatically revoke Patient-care permissions.
- **Independent safety action:** If a safety risk exists, authorized Family Members must use immediate relationship termination (Section 13) or the Safety workflow (`07-SAFETY.md`).
- **Boundaries:** V1 does not implement automated enforcement, staffed response-time guarantees, or a complex judicial dispute-resolution mechanism.
- **Privacy:** Report contents and evidence are restricted to platform review and are not broadcast to other Circle members or made public.
- **Authorization:** Only authenticated users with an active or historical relationship to the caregiver/Patient may submit reports.

---

# 21. Authorization Rule

For a protected caregiver action, the system evaluates the conditions required for that specific action.

For example, a Patient-care action requires:

```text
Authenticated User
        +
Professional Caregiver Role
        +
Circle Membership
        +
Active Caregiver Relationship (or Notice Period)
        +
Patient Assignment
        +
Required Care Permission
        =
Authorized Action
```

A relationship-management action instead requires:

```text
Authenticated User
        +
Circle Membership
        +
Manage Caregiver Relationships Permission
        =
Authorized Relationship Management
```

`Manage Member Permissions` alone or routine-management permission alone does not satisfy this rule.

The exact authorization requirements remain operation-specific.

---

# 22. Notifications

Relevant parties are notified of defined lifecycle events, including:

- Family confirmation
- Circle joining
- Relationship establishment
- Patient assignment
- Permission changes
- Relationship suspension
- Relationship restoration
- Caregiver-initiated termination entering `Notice Period` (notifying Family)
- Automatic 7-day notice expiration / termination
- Family-initiated immediate termination
- Safety-critical care-gap creation where applicable
- Caregiver report submission and status update (to submitting user)

Notification delivery does not itself grant or revoke authorization.

---

# 23. Audit

The system records:

- Relationship initiation
- Family confirmation
- Circle joining
- Relationship establishment
- Assignment
- Permission changes
- Suspension
- Restoration
- Notice Period initiation, category/reason, and computed effective termination timestamp
- Automatic lifecycle termination upon 7-day notice expiration
- Immediate termination (Family-initiated or safety exception)
- Safety-gap trigger resulting from relationship changes
- Caregiver report submission, status transitions (`Submitted → Under Review → Resolved`), and review outcome

Each event records the responsible actor/system action and timestamp.

Historical care records retain the identity of the caregiver who performed the action.

---

# 24. Failure / Edge Cases

### Family confirmation occurs but caregiver does not join Circle

Relationship remains incomplete. No Active relationship is established.

### Caregiver joins Circle but relationship establishment fails

Circle membership remains governed by the Circle workflow, but no Patient-care relationship is created.

### Relationship is Active but caregiver has not yet been assigned

The relationship remains Active. The caregiver cannot perform Patient-specific care actions requiring assignment.

### Caregiver-initiated termination during network outage

The 7-day notice timer is server-authoritative. Automatic termination commits server-side upon expiration regardless of client device connectivity.

### Family terminates immediately during Notice Period

Relationship immediately transitions to `Terminated`. The remaining notice days are cancelled, and caregiver access is revoked immediately.

### Immediate safety exception invoked

Notice period is bypassed. Relationship is immediately terminated/suspended, and the Safety workflow is triggered.

### Caregiver loses Circle membership

Relationship-derived access is immediately revoked. Relationship state is handled according to the Circle membership lifecycle.

### Permission is revoked while caregiver is using the app

The next protected operation is denied.

### Caregiver is terminated while online

The session may remain authenticated, but all newly protected Patient-care operations requiring the terminated relationship are denied immediately.

### Relationship termination creates a care gap

The relationship is still terminated. The Safety workflow separately evaluates and manages the resulting care gap.

### Caregiver report submitted without evidence

Report is successfully submitted with `Submitted` status. Platform review proceeds based on category and description.

---

# 25. Acceptance Criteria

- Caregiver interest does not create an active relationship.
- Family confirmation is a separate decision.
- Caregiver must join the relevant Care Circle.
- Circle membership is separate from the caregiver relationship.
- Active relationship establishment does not require Patient assignment.
- Patient assignment requires an Active caregiver relationship.
- Patient assignment is separate from relationship state.
- Care access is separate from both relationship and assignment.
- The canonical `Manage Caregiver Relationships` permission is required for all relationship management operations.
- Circle membership alone does not grant caregiver-management authority.
- Routine-management permission alone does not grant caregiver-management authority.
- Only the Circle Owner or a member explicitly delegated `Manage Caregiver Relationships` can perform relationship-management actions, subject to the existing Circle delegation rules.
- Professional Caregiver can voluntarily terminate their own relationship.
- Caregiver-initiated termination transitions the relationship into a 7-day `Notice Period`.
- During the `Notice Period`, the relationship remains active and existing care permissions remain in effect.
- The notice period does not guarantee replacement care, backup coverage, or safety handover.
- Family Members with `Manage Caregiver Relationships` can terminate immediately at any time during the notice period.
- At the end of seven days, the relationship automatically transitions from `Notice Period` to `Terminated`, ending assignment and immediately revoking care access.
- Suspension immediately blocks relationship-derived protected access.
- Termination immediately ends assignment and revokes relationship-derived access.
- Existing sessions cannot bypass revoked authorization.
- Ending a relationship does not imply that the resulting care gap has been resolved.
- Safety consequences are explicitly handed to the Safety workflow.
- Duplicate Active relationships are prevented.
- Caregiver reporting supports defined categories and follows `Submitted → Under Review → Resolved`.
- Submitting a caregiver report does not automatically alter relationship status or revoke care permissions.
- Historical caregiver actions remain attributable after termination.
- Major relationship state transitions and report statuses are auditable.

---

# Boundary

`06-CAREGIVER-RELATIONSHIP.md` answers:

> **“After a caregiver is interested and the family decides to proceed, how does the caregiver formally become connected to the Patient, join the Circle, establish the relationship, become assigned, receive permissions, provide care, and eventually leave?”**

It does not define:

- Caregiver discovery → `05-CAREGIVER-DISCOVERY.md`
- General Circle membership/permissions → `03-CARE-CIRCLE.md`
- Daily care tasks → `04-PATIENT-CARE.md`
- Safety response and care-gap resolution → `07-SAFETY.md`
- Location and Safe Zones → `08-LOCATION-AND-SAFE-ZONES.md`