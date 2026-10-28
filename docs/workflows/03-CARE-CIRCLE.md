# SureStep — Care Circle Workflows

## Purpose

Define how SureStep Care Circles are created, joined, managed, and terminated.

A Care Circle is the underlying relationship structure through which authorized people coordinate care for one or more Patients.

A Care Circle may contain:

- Family Members
- Professional Caregivers
- Patients

A Patient cannot create a Care Circle.

A Caregiver or Family Member can create a Care Circle.

---

# 1. Create Care Circle

## Actor

Family Member or Professional Caregiver.

## Goal

Create a Care Circle for coordinating care.

## Preconditions

- User is authenticated.
- User is not a Patient.
- User does not currently belong to an active Care Circle.

## Flow

1. User selects **Create Care Circle**.
2. System asks for the Circle name.
3. User enters the Circle name.
4. System validates the name.
5. User confirms creation.
6. System creates the Care Circle.
7. User becomes the Circle Owner.
8. System grants the Owner's default Circle permissions.
9. Circle is marked active.
10. User can begin inviting members and connecting Patients.

## Rules

- A Patient cannot create a Circle.
- A user can have only one active Care Circle in V1.
- The creator automatically becomes Owner.
- The Owner cannot be removed by another member.
- Creating a Circle does not automatically add a Patient.
- Creating a Circle does not automatically add other members.

## Acceptance Criteria

- An eligible user can create a Circle.
- The creator becomes Owner.
- The Circle becomes active after successful creation.
- A Patient cannot create a Circle.
- A user already belonging to an active Circle cannot create another active Circle.

---

# 2. Invite Member

## Actor

Circle Owner or authorized member with invitation permission.

## Goal

Invite another user to join the Care Circle.

## Preconditions

- Circle is active.
- Actor has permission to invite members.
- Invitation capability has not been revoked.

## Flow

1. Actor selects **Invite Member**.
2. System generates an invitation.
3. Invitation contains:
   - 6-digit code
   - Invite link
4. System sets the invitation expiry.
5. Actor shares the code or link with the intended person.
6. Intended person opens the link or enters the code.
7. System validates the invitation.
8. Intended person authenticates or creates their appropriate account.
9. System creates a pending Circle join request.
10. System marks the invitation as **Used**.
11. Owner/authorized member receives the request.

## Rules

- Invitation expires after approximately 72 hours if unused.
- An invitation becomes **Used when it successfully creates a join request**, not when membership is approved.
- A Used invitation is no longer usable for creating another join request.
- Regenerating an active invitation invalidates the previous invitation.
- Invitation access does not expose Patient care information before Circle membership is approved.
- Invitation validity and membership approval are separate states.

## Acceptance Criteria

- Authorized members can generate invitations.
- Invitations contain a code and link.
- Expired invitations cannot be used.
- A Used invitation cannot create another join request.
- Invitation use does not itself create Circle membership.
- Invitation use does not grant Patient access.

---

# 3. Use Circle Invitation

## Actor

Invited user.

## Goal

Use a valid invitation to submit a request to join a Care Circle.

## Preconditions

- User has received a valid unused invitation.
- User has authenticated or completed account creation.

## Flow

1. User opens the invitation link or enters the 6-digit code.
2. System validates the invitation.
3. System displays basic Circle information.
4. User confirms that they want to join.
5. System creates a pending join request.
6. System marks the invitation as **Used**.
7. System notifies the Circle Owner or authorized member.
8. User waits for approval.

## Rules

- Before approval, the user is not a Circle member.
- Before approval, the user cannot access Patient care information.
- The invitation does not automatically grant permissions.
- A user cannot create duplicate pending requests for the same Circle.
- Using an invitation does not guarantee membership.

## Failure Cases

- Invitation expired.
- Invitation revoked before use.
- Invitation already Used.
- User is already a member.
- User already has a pending request for the Circle.
- User already belongs to another active Circle.

## Acceptance Criteria

- Valid invitations can create join requests.
- Invalid invitations cannot create join requests.
- Used invitations cannot be reused.
- Pending users cannot access Circle or Patient information.
- Invitation use and membership approval remain separate operations.

---

# 4. Accept Join Request

## Actor

Circle Owner or authorized member with member-management permission.

## Goal

Approve a user's request to join the Circle.

## Preconditions

- Circle is active.
- Join request is pending.
- Actor has member-management permission.

## Flow

1. Actor opens the pending request.
2. System displays the requester's relevant identity information.
3. Actor selects **Accept**.
4. System changes the request to Accepted.
5. System creates Circle membership.
6. System grants the member basic Circle membership access.
7. System records the membership change.
8. System notifies the new member.

## Rules

- Acceptance creates Circle membership.
- Acceptance does not automatically grant unrestricted access to every Patient.
- Patient-specific access is controlled separately.
- Caregiver assignment is separate from Circle membership.
- The member-management permission does not include permission management.

## Acceptance Criteria

- Authorized members can accept requests.
- Accepted users become Circle members.
- Membership is recorded.
- The new member does not automatically receive unrestricted Patient access.

---

# 5. Reject Join Request

## Actor

Circle Owner or authorized member with member-management permission.

## Goal

Prevent an applicant from joining the Circle.

## Flow

1. Actor opens the pending request.
2. Actor selects **Reject**.
3. System changes the request to Rejected.
4. Requester is notified.
5. Requester does not become a Circle member.

## Rules

- Rejection does not grant Circle access.
- Rejected requests cannot be treated as active membership.
- The requester may receive a new invitation later if the Circle allows it.
- Rejection does not delete the user's SureStep account.

## Acceptance Criteria

- Authorized members can reject pending requests.
- Rejected users cannot access Circle information.
- Rejection is recorded.

---

# 6. Patient Joins Care Circle

## Actor

Patient.

## Goal

Allow a Patient to explicitly join an existing Care Circle.

## Preconditions

- Patient has an authenticated Patient account.
- Patient has received a valid Circle invitation.
- Patient is not currently in an active Circle.

## Flow

1. Patient opens the invitation link or enters the 6-digit code.
2. System validates the invitation.
3. System presents the Circle information needed for the Patient to understand the invitation.
4. Patient explicitly confirms that they want to join.
5. System creates a pending join request.
6. Circle Owner/authorized member receives the request.
7. Owner/authorized member accepts the request.
8. System creates the Patient's Circle membership.
9. System records the membership.

## Rules

- Patient consent is required before the Patient can become a Circle member.
- Patient must explicitly accept the invitation.
- Patient does not need a separate invitation OTP.
- Phone authentication OTP remains the authentication mechanism.
- Patient cannot create a Circle.
- Patient cannot manage Circle permissions.
- Patient membership does not automatically grant other members access to Patient data.

## Acceptance Criteria

- Patient can join a Circle through an invitation.
- Patient must explicitly confirm joining.
- Patient membership cannot be created solely by another member adding the Patient.
- Patient does not need a separate invitation OTP.
- Patient cannot manage Circle administration.

---

# 7. Patient-Circle Association

Patient association is established through the **Patient Join workflow**.

There is no separate administrative flow that allows a Circle member to silently add a Patient to a Circle.

## Flow

1. A Patient receives a Circle invitation.
2. Patient explicitly accepts the invitation.
3. Patient submits the join request.
4. Circle Owner/authorized member approves the request.
5. System creates the Patient's Circle membership.
6. Patient is now associated with the Circle.
7. Authorized members can manage Patient-specific access according to their permissions.

## Rules

- Section 6 is the authoritative workflow for Patient Circle membership.
- A Circle Owner cannot bypass Patient consent by using an **Add/Connect Patient** action.
- A Patient cannot become associated with a Circle without the Patient's explicit acceptance.
- Patient-Circle membership and member permissions remain separate states.
- A Circle may contain multiple Patients.

## Acceptance Criteria

- Every Patient-Circle membership can be traced to an accepted Patient invitation.
- No administrative shortcut can silently associate a Patient with a Circle.
- Patient consent occurs before membership is established.

---

# 8. Assign Caregiver to Patient

## Actor

Circle Owner or authorized member holding the canonical `Manage Caregiver Relationships` permission.

## Goal

Connect an already accepted Professional Caregiver to a specific Patient through an active caregiver relationship.

## Preconditions

- Circle is active.
- Caregiver is an active Circle member.
- Patient is an active member/Patient associated with the Circle.
- Actor has the `Manage Caregiver Relationships` permission.
- A valid caregiver relationship has been established through the caregiver relationship workflow.
- The caregiver relationship is in an **Active** state.

## Flow

1. Authorized member opens the Patient's caregiver management.
2. System displays eligible Professional Caregivers.
3. System verifies that the selected caregiver has an Active caregiver relationship with the Patient.
4. Actor confirms the assignment.
5. System creates the caregiver-patient assignment.
6. System grants the caregiver the access associated with that active relationship.
7. Caregiver is notified.
8. Assignment is recorded.

## Rules

- Circle membership alone is not sufficient for Patient assignment.
- A caregiver must have an Active caregiver relationship before receiving Patient assignment.
- Caregiver discovery/application/hiring is handled by the caregiver workflows.
- Circle membership and caregiver relationship are separate states.
- Caregiver access is Patient-specific.
- A caregiver can be assigned to multiple Patients within their single active Circle.
- A caregiver cannot access another Patient merely because they are assigned to one Patient.
- Cross-Circle caregiver support is not part of V1.

## Acceptance Criteria

- A caregiver cannot be assigned to a Patient solely because they joined the Circle.
- An Active caregiver relationship is required.
- Assignment grants only the relevant Patient access.
- A caregiver assigned to Patient A cannot automatically access Patient B.
- Multiple Patients can be assigned to the same caregiver within the same Circle.

---

# Corrections to `03-CARE-CIRCLE.md`

## 9. Grant Permission

### Actor

Circle Owner or Circle member who has been explicitly granted **Manage Member Permissions**.

### Goal

Grant a Circle member an additional permission.

### Preconditions

- Circle is active.
- Actor is either:
  - the Circle Owner, or
  - a member with the `Manage Member Permissions` permission.
- Target user is a Circle member.

### Flow

1. Actor opens the target member's permissions.
2. System displays permissions that can be delegated.
3. Actor selects the permission to grant.
4. System verifies that the selected permission is delegatable.
5. System grants the permission.
6. System records who granted the permission.
7. System records the permission change in Activity/audit.
8. Target member is notified when appropriate.

### Delegatable Permissions

Examples include:

- View Patient care profile
- Edit Patient care profile
- View Patient location
- Manage Safe Zones
- Receive safety alerts
- Respond to safety alerts
- Manage routines
- Invite members
- Manage memories (governed by `Manage Patient Memories`)
- View Activity
- Search/Request Caregivers
- Manage Caregiver Relationships
- Manage Circle members

### Search/Request Caregivers Permission

`Search/Request Caregivers` is a delegatable permission:
- One unified permission covers searching/evaluating caregiver profiles, initiating care requests, and publishing care requirements.
- The Circle Owner can delegate or revoke this permission through the established permission-management mechanism.
- Family Members holding this permission may act only for Patients they are authorized to manage within the active Circle.
- Patient self-discovery remains governed by the Patient's own access rules (self-registered Patients can search for themselves; assisted Patients have discovery handled by an authorized Family Member with this permission).
- Circle membership alone does not grant caregiver-discovery authority.

### Manage Caregiver Relationships Permission

`Manage Caregiver Relationships` is the canonical delegatable permission governing caregiver management:
- Governs management of active caregiver relationships, including confirmation, assignment coordination, suspension, and termination, subject to the existing relationship lifecycle rules.
- Distinct from Circle membership, Patient assignment, routine management, and general permission administration (`Manage Member Permissions`).
- The Circle Owner can delegate or revoke this permission through the established permission-management mechanism.
- Circle membership alone does not grant caregiver-management authority.

### Permission Management

`Manage Member Permissions` is itself a delegatable permission.

Therefore:

- Owner automatically has `Manage Member Permissions`.
- Owner can grant `Manage Member Permissions` to another eligible Circle member.
- A member with `Manage Member Permissions` can grant or revoke other delegatable permissions.
- A member cannot grant themselves `Manage Member Permissions`.
- A member cannot grant another member a permission that the granting actor does not possess.
- Only the Owner can grant or revoke the `Manage Member Permissions` permission itself.

### Non-Delegatable Permissions

These remain Owner-only:

- Transfer ownership
- Remove the Owner
- Delete the Circle

### Rules

- Permission changes take effect immediately.
- Granting one permission does not automatically grant unrelated permissions.
- Every permission change records the actor responsible.
- Permission management itself is subject to authorization checks.

### Acceptance Criteria

- Owner can manage all member permissions.
- An explicitly authorized member can manage delegatable permissions.
- An unauthorized member cannot change another member's permissions.
- `Manage Member Permissions` can only be granted or revoked by the Owner.
- Owner-only permissions cannot be delegated.

---

# 10. Revoke Permission

### Actor

Circle Owner or Circle member who has been explicitly granted `Manage Member Permissions`.

### Goal

Remove a previously granted permission.

### Preconditions

- Circle is active.
- Actor has permission-management authority.
- Target user is a Circle member.
- Target has the permission being revoked.

### Flow

1. Actor opens the target member's permissions.
2. System displays currently granted permissions.
3. Actor selects a permission to revoke.
4. System verifies that the actor is authorized to revoke it.
5. System removes the permission.
6. System immediately revokes access controlled by that permission.
7. System records the change.
8. Target member is notified when appropriate.

### Rules

- Owner can revoke any delegatable permission.
- A member with `Manage Member Permissions` can revoke delegatable permissions.
- `Manage Member Permissions` itself can only be revoked by the Owner.
- Owner-only permissions cannot be granted or revoked through delegation.
- Revocation takes effect immediately.
- Existing sessions must respect the new authorization state.

### Acceptance Criteria

- Owner can revoke permissions.
- Authorized permission managers can revoke delegatable permissions.
- Unauthorized members cannot revoke permissions.
- `Manage Member Permissions` remains Owner-controlled.
- Revoked access cannot be used after revocation.

---

# 11. Remove Circle Member

Removing a **Patient** is not the same operation as removing a **Family Member** or **Professional Caregiver**.

The system must determine the member type before executing removal.

---

## 11.1 Remove Family Member

### Actor

Circle Owner or member with `Manage Circle Members`.

### Goal

Remove a Family Member from the Circle.

### Flow

1. Authorized actor selects the Family Member.
2. System displays the access and permissions that will be lost.
3. Actor confirms removal.
4. System removes the Family Member from the Circle.
5. Circle-based permissions are immediately revoked.
6. Any Patient-specific access obtained through the Circle is revoked.
7. System records the removal.
8. Family Member is notified.

### Rules

- The Owner cannot be removed.
- Removal does not delete the Family Member's SureStep account.
- Historical Activity/audit records remain.
- Removing the Family Member does not delete Patient data.

### Acceptance Criteria

- Authorized members can remove a Family Member.
- Their Circle access is immediately revoked.
- Their Patient access derived from the Circle is revoked.
- Their SureStep account remains intact.

---

## 11.2 Remove Professional Caregiver

### Actor

Circle Owner or member with `Manage Circle Members`.

### Goal

Remove a Professional Caregiver from the Circle without leaving an active caregiver relationship behind.

### Flow

1. Authorized actor selects the Professional Caregiver.
2. System checks whether the caregiver has active Patient relationships.
3. If active relationships exist, the system displays the affected Patients and relationships.
4. The system starts the caregiver relationship termination workflow for affected relationships.
5. Once the required relationship termination state is reached, the caregiver's Circle membership is removed.
6. Circle-based permissions are revoked.
7. Patient assignments are removed.
8. System records the removal and relationship termination.
9. Caregiver is notified.

### Rules

- A caregiver cannot be removed in a way that silently leaves their caregiver relationships Active.
- Active caregiver relationships follow the lifecycle defined in `06-CAREGIVER-RELATIONSHIP.md`.
- Removing Circle membership ultimately removes Circle-derived Patient access.
- The caregiver's SureStep account is not deleted.

### Acceptance Criteria

- System detects active caregiver relationships before removal.
- Active relationships are explicitly handled.
- Caregiver access is revoked when the relationship reaches its required termination state.
- No Active caregiver relationship remains solely because Circle membership was removed.

---

# 11.3 Remove Patient

### Actor

Circle Owner or member with appropriate Circle-management authority.

### Goal

Remove a Patient from the Care Circle without silently disrupting care or safety responsibilities.

### Preconditions

- Patient is currently associated with the Circle.

### Flow

1. Authorized actor selects the Patient.
2. System does **not** immediately remove the Patient.
3. System displays the consequences of removal, including:
   - Circle members who currently have access
   - Active caregiver relationships
   - Active caregiver assignments
   - Safety monitoring associated with the Circle
   - Safe Zones associated with the Patient/Circle
   - Other care responsibilities that will be affected
4. System requires explicit confirmation.
5. System identifies all active caregiver relationships associated with the Patient.
6. The caregiver relationship termination workflow is initiated for affected caregivers.
7. Required safety/access transitions are completed according to the relevant workflows.
8. Patient is removed from the Circle.
9. Circle-derived access to the Patient is revoked.
10. Caregiver assignments associated with this Circle are removed.
11. Circle-specific monitoring/configuration associated with the Patient is stopped or deactivated according to the Safety workflow.
12. Patient's own SureStep account and Patient-owned data remain intact.
13. System records the Patient departure/removal.
14. Affected members and caregivers are notified.

### Rules

- Patient removal is **not** an ordinary member-removal operation.
- Patient removal must not silently terminate care relationships.
- Active caregiver relationships must follow their defined termination lifecycle.
- Circle-based access to the Patient is revoked after the required transition.
- Patient-owned data is not deleted merely because the Patient leaves the Circle.
- The Patient can subsequently join another Circle if they are no longer an active member of this Circle.
- Patient removal must preserve enough information for affected caregivers/family members to understand that access has ended.

### Acceptance Criteria

- Removing a Patient requires explicit confirmation.
- System identifies affected care relationships before removal.
- Active caregiver relationships are handled through their defined lifecycle.
- Patient access is not silently disrupted without the required transition.
- Circle-derived access is revoked.
- Patient account and Patient-owned data remain intact.
- Removal is recorded.
- Affected parties are notified.

---

# 11.4 Patient Voluntary Departure

A Patient leaving voluntarily follows the same safety-aware lifecycle as Patient removal.

### Flow

1. Patient selects **Leave Care Circle**.
2. System explains what access and care relationships will be affected.
3. System identifies active caregiver relationships and safety responsibilities.
4. Patient confirms departure.
5. Relevant caregiver relationship termination workflows are initiated.
6. Required safety transitions are completed.
7. Patient's Circle membership is ended.
8. Circle-derived access is revoked.
9. Circle-specific care/safety relationships are updated.
10. System records the departure.
11. Affected members and caregivers are notified.

### Rules

- Patient departure must not behave like an ordinary member leaving.
- Patient confirmation is required.
- Active care relationships cannot silently remain Active after the Patient leaves the Circle.
- Patient-owned data remains with the Patient account.

---

# 12. Leave Care Circle

This workflow applies to **Family Members and Professional Caregivers**.

Patient departure uses the dedicated Patient Departure workflow in Section 11.4.

## Actor

Family Member or Professional Caregiver who is not the Owner.

## Flow

1. Member selects **Leave Care Circle**.
2. System checks whether the member has active Patient assignments or caregiver relationships.
3. If the member is a Professional Caregiver with active relationships, the caregiver relationship termination workflow is initiated.
4. System explains the access that will be lost.
5. Member confirms.
6. Required relationship termination state is reached.
7. Member is removed from the Circle.
8. Circle-derived permissions and Patient access are revoked.
9. System records the departure.
10. Affected parties are notified when required.

## Rules

- Owner cannot simply leave the Circle.
- Owner must transfer ownership or delete the Circle.
- A caregiver cannot leave while silently preserving Active caregiver relationships.
- Leaving does not delete the user's SureStep account.

---

# 13. Care Circle Deletion — Relationship Coordination

When a Circle is deleted, the system must explicitly coordinate the termination of all affected care relationships.

## Flow

1. Owner selects **Delete Care Circle**.
2. System identifies:
   - Patients
   - Family Members
   - Professional Caregivers
   - Active caregiver relationships
   - Patient assignments
   - Safety configurations
   - Pending requests
   - Active invitations
3. System displays the consequences.
4. Owner explicitly confirms deletion.
5. System begins Circle termination.
6. Active caregiver relationships are transitioned through the caregiver relationship termination workflow.
7. Patient assignments are removed.
8. Circle memberships are ended.
9. Circle-based permissions are revoked.
10. Circle invitations are invalidated.
11. Pending join requests are cancelled.
12. Circle-specific safety configurations are deactivated according to the Safety workflow.
13. Circle is marked terminated.
14. Affected users are notified.
15. Audit records are retained.

## Critical Rule

**Deleting a Circle must never leave an Active caregiver relationship that depends on that Circle.**

The Circle lifecycle and caregiver relationship lifecycle must therefore reach a consistent terminal state.

---

# Permission Hierarchy

The resulting authorization model is:

```text
Circle Owner
    │
    ├── All Circle permissions
    │
    └── Manage Member Permissions
            │
            ├── Grant delegatable permissions
            └── Revoke delegatable permissions
```

A delegated permission manager **cannot**:

```text
Transfer Ownership
Delete Circle
Remove Owner
Grant themselves additional authority
Grant Owner-only permissions
```

This keeps permission administration delegatable without allowing delegated administrators to take ownership of the Circle itself.

---

# 14. Delete Care Circle

## Actor

Circle Owner.

## Goal

Permanently terminate a Care Circle.

## Preconditions

- User is the Circle Owner.
- Circle is active.

## Flow

1. Owner selects **Delete Care Circle**.
2. System explains the consequences.
3. System identifies active members, Patients, caregiver relationships, assignments, invitations, and other active Circle resources.
4. Owner explicitly confirms deletion.
5. System marks the Circle as terminated.
6. All Circle memberships are ended.
7. All Circle-based permissions are revoked.
8. All caregiver assignments associated with the Circle are removed.
9. Every **Active caregiver relationship associated with the Circle is terminated according to the Caregiver Relationship workflow**.
10. Active and unused Circle invitations are invalidated.
11. Pending join requests associated with the Circle are cancelled.
12. Circle-specific Safe Zones and other Circle resources are deactivated/removed according to their respective lifecycle rules.
13. System records the Circle termination.
14. Affected members and caregivers are notified.

## Rules

- Only the Owner can delete the Circle.
- Deletion requires explicit confirmation.
- Deleting the Circle does not delete member user accounts.
- Deleting the Circle does not delete Patient accounts.
- Circle-based access ends when the Circle is terminated.
- Active caregiver relationships cannot remain Active after Circle termination.
- Invitations can no longer be used.
- Pending join requests cannot later become memberships.
- Patient-owned data remains with the Patient account unless its own lifecycle explicitly says otherwise.
- Historical records required for audit are retained according to the system's retention policy.

## Acceptance Criteria

- Only the Owner can delete the Circle.
- Deletion requires explicit confirmation.
- Circle-based access is revoked.
- Active caregiver relationships do not remain active after deletion.
- Members retain their SureStep accounts.
- Patients retain their Patient accounts.
- Invitations become invalid.
- Pending join requests are cancelled.
- The Circle termination is recorded.

---

# 15. Invitation Lifecycle

An invitation and a join request are separate entities.

## Invitation States

```text
Created
   ↓
Active
   ├── Used
   ├── Expired
   └── Revoked
```

## State Definitions

### Active

Invitation can be used to create a join request.

### Used

The invitation has successfully created a join request.

It cannot be used again.

**Used does not mean that the user has joined the Circle.**

### Expired

The invitation reached its expiry time without being used.

### Revoked

The invitation was explicitly invalidated before use.

## Rules

- Default invitation lifetime is approximately 72 hours.
- Regenerating an invitation invalidates the previous Active invitation.
- An expired or revoked invitation cannot create a join request.
- A Used invitation cannot create another join request.
- Using an invitation does not itself create Circle membership.
- Membership requires approval through the Join Request workflow.

---

# 16. Join Request Lifecycle

Join requests represent the approval state after an invitation has been successfully used.

## States

```text
Pending
  ├── Accepted → Member
  └── Rejected
```

A pending request may also become:

```text
Pending → Cancelled
Pending → Invalidated
```

when the Circle itself is terminated or another system rule explicitly invalidates the request.

## Rules

- A Pending user is not a Circle member.
- Pending users cannot access Circle-protected Patient information.
- An Accepted request creates Circle membership.
- A Rejected request does not create membership.
- A Used invitation remains Used even if its resulting request is later rejected.
- Revoking an invitation after it has become Used does not revoke the already-created join request.
- A pending request must be resolved through its own lifecycle.
- Join-request state changes are recorded.

## Important Separation

```text
Invitation
    ↓
Used
    ↓
Join Request
    ↓
Pending
    ↓
Accepted
    ↓
Circle Membership
```

Therefore:

**Invitation validity determines whether a new join request can be created.**

**Join-request approval determines whether Circle membership is created.**

Neither state substitutes for the other.

---

# 17. Membership and Access Rules

Circle membership and Patient access are separate concepts.

A member may be:

```text
Circle Member
    ↓
No Patient Assignment
```

or:

```text
Circle Member
    ↓
Patient Assignment
    ↓
Patient Access
    ↓
Specific Permissions
```

Therefore:

- Circle membership does not automatically mean unrestricted Patient access.
- Patient assignment does not automatically grant every possible permission.
- Permissions determine what actions the member can perform.
- Removing membership revokes Circle-derived access.
- Removing Patient assignment revokes Patient-specific access.
- Revoking a permission removes only access controlled by that permission.
- A Professional Caregiver requires an Active caregiver relationship before Patient assignment can grant care access.

---

# 18. One Active Circle Rule

## Rule

In V1, each user can belong to only one active Care Circle.

## Flow

If a user attempts to join another Circle:

1. System checks whether the user already belongs to an active Circle.
2. If they do, the system prevents the new membership.
3. User must leave their existing Circle or otherwise terminate that membership according to the relevant workflow.
4. Once no active Circle membership remains, the user can join another Circle.

## Acceptance Criteria

- A user cannot simultaneously belong to multiple active Circles.
- Existing Circle membership is not silently replaced.
- Leaving one Circle does not automatically join another.

---

# 19. Permission Revocation During Active Use

## Scenario

A member is currently using SureStep when their permission or Circle membership changes.

## Rules

- Authorization is checked when protected operations are performed.
- Revoked permissions take effect immediately.
- An already-open screen must not allow an operation that the user is no longer authorized to perform.
- Removing a member immediately ends Circle-derived access.
- Revoking access does not require the user to manually log out first.

## Acceptance Criteria

- A revoked member cannot perform newly unauthorized actions.
- A removed member cannot continue accessing protected Patient information through an existing session.
- Authorization changes take effect without requiring manual session termination.

---

# 20. Circle Activity and Audit

The following Circle events must be recorded:

- Circle created
- Invitation generated
- Invitation regenerated
- Invitation revoked
- Invitation used
- Join request created
- Join request accepted
- Join request rejected
- Join request cancelled/invalidated
- Member added
- Member removed
- Member left
- Patient connected
- Patient assignment created
- Patient assignment removed
- Permission granted
- Permission revoked
- Ownership transferred
- Caregiver relationship terminated because of Circle lifecycle
- Circle deleted

The user-facing Activity system and backend audit record may expose different levels of detail, but security-relevant actions must remain auditable.

---

# 21. Care Circle Boundary Rules

The following are intentionally handled by other workflows:

- Patient onboarding → `02-PATIENT-ONBOARDING.md`
- Patient care/routines → `04-PATIENT-CARE.md`
- Caregiver opportunity discovery → `05-CAREGIVER-DISCOVERY.md`
- Caregiver application, engagement, assignment, and termination → `06-CAREGIVER-RELATIONSHIP.md`
- Safety and Safe Zones → `07-SAFETY.md`
- Memories and activities → `09-MEMORIES-AND-ACTIVITIES.md`
- Notifications and Activity presentation → `10-NOTIFICATIONS-AND-ACTIVITY.md`

The Care Circle workflow defines **membership, Circle relationships, permissions, and access boundaries**.

It does not independently create caregiver employment/engagement relationships or bypass Patient consent.