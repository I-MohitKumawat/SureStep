# SureStep — Identity & Authentication Workflows

## Purpose

Define how users create, access, and manage their SureStep accounts.

SureStep has exactly three user roles:

- Patient
- Family Member
- Professional Caregiver

All users authenticate using their phone number.

---

# 1. Authentication / Account Entry

## Actor

Any user.

## Goal

Allow an existing user to sign in or a new user to begin account creation using their phone number.

## Preconditions

- User has access to a phone number.

## Flow

1. User opens SureStep.
2. User enters their phone number.
3. System checks whether the phone number is already associated with a SureStep account.
4. If the phone number is already registered:
   - System sends an OTP.
   - User enters the OTP.
   - System verifies the OTP.
   - User is signed in.
   - User is taken to the appropriate interface for their role.
5. If the phone number is not registered:
   - System sends an OTP.
   - User enters the OTP.
   - System verifies the OTP.
   - User selects their role:
     - Patient
     - Family Member
     - Professional Caregiver
   - System creates the account.
   - User is taken to the onboarding flow for the selected role.

## Rules

- Registration and sign-in use the same phone-number entry flow.
- The system determines whether the user is new or existing.
- A verified phone number can belong to only one SureStep account.
- Phone ownership must be verified before either account creation or sign-in is completed.
- An existing account must never result in creation of a duplicate account.

## Failure Cases

- Invalid phone number.
- OTP delivery failure.
- Incorrect OTP.
- Expired OTP.
- Too many OTP attempts.
- Authentication service failure.

## Acceptance Criteria

- A new phone number leads to account creation after OTP verification.
- An existing phone number leads to sign-in after OTP verification.
- An existing account is never duplicated.
- The user's role is preserved when signing in.
- An unverified phone number cannot authenticate or create an account.

---

# 2. OTP Verification

## Actor

User attempting to authenticate.

## Goal

Verify ownership of the phone number.

## Flow

1. System generates an OTP.
2. System sends the OTP to the entered phone number.
3. User enters the OTP.
4. System validates the OTP.
5. If valid, the authentication flow continues.
6. If invalid or expired, authentication does not continue.

## Rules

- OTPs expire after a limited period.
- An expired OTP cannot be used.
- Requesting a new OTP invalidates the previous OTP.
- Failed verification attempts are rate-limited.

## Failure Cases

- Incorrect OTP.
- Expired OTP.
- Too many verification attempts.
- New OTP requested.
- OTP delivery failure.

## Acceptance Criteria

- Only a valid OTP can complete phone verification.
- An expired OTP cannot be used.
- A previous OTP becomes invalid after a new OTP is issued.
- Excessive failed attempts are rate-limited.

---

# 3. Session Creation

## Actor

Authenticated user.

## Goal

Create an authenticated session after successful phone verification.

## Flow

1. User successfully verifies their OTP.
2. System identifies the associated account.
3. System creates an authenticated session.
4. System loads the user's authorized role and access.
5. User is directed to the appropriate interface.

## Rules

- A session can only be created after successful authentication.
- Authentication identifies the account; it does not by itself grant access to patient information.
- Patient information access is determined by the relevant Care Circle, patient assignment, and permission workflows.

## Acceptance Criteria

- A valid authentication produces an authenticated session.
- The session is associated with the correct account.
- The user receives the correct role-specific interface.
- The session cannot provide access beyond the user's authorization.

---

# 4. Logout

## Actor

Authenticated user.

## Goal

End the current authenticated session.

## Flow

1. User selects **Log Out**.
2. System invalidates the current session.
3. User is returned to the authentication screen.

## Rules

- Logout ends the current authenticated session.
- Logout does not delete the account.
- Logout does not remove Circle memberships or care relationships.

## Acceptance Criteria

- The ended session cannot access protected resources.
- The user can authenticate again using the same account.
- Account data and relationships remain unchanged.

---

# 5. Change Phone Number

## Actor

Authenticated user.

## Goal

Replace the phone number used to authenticate the account.

## Preconditions

- User is authenticated.
- User provides a new phone number.

## Flow

1. User opens account settings.
2. User selects **Change Phone Number**.
3. User enters the new phone number.
4. System checks whether the new phone number is already registered.
5. If the number is already registered:
   - System rejects the change.
   - Existing account remains unchanged.
   - Account associated with the new number remains unchanged.
6. If the number is not registered:
   - System sends an OTP to the new number.
7. User enters the OTP.
8. System verifies the OTP.
9. If verification succeeds:
   - New number becomes the account's authentication identifier.
   - Old number is removed as an authentication identifier for that account.
10. If the user abandons verification or verification fails:
   - Old number remains active.
   - Account remains unchanged.

## Rules

- The new phone number must not already belong to another SureStep account.
- The new phone number becomes the authentication identifier only after successful verification.
- The account must never be left with an unverified new number.
- The old number remains active until the new number is successfully verified.
- Changing the phone number does not create a new account.
- Existing Circle memberships, patient relationships, caregiver relationships, routines, memories, and other account data remain associated with the same account.

## Failure Cases

### New number already registered

- Reject the change.
- Do not modify either account.

### Verification abandoned

- Keep the old number active.
- Keep the account unchanged.

### Verification fails

- Keep the old number active.
- Keep the account unchanged.

### Verification succeeds

- New number becomes the authentication identifier.
- Old number can no longer authenticate to that account.

## Acceptance Criteria

- A registered phone number cannot replace another account's phone number.
- The old number remains usable if verification of the new number is abandoned or fails.
- The new number becomes active only after successful verification.
- The old number cannot authenticate to the account after a successful change.
- The user's existing account data and relationships remain intact.

---

# 6. Account Deletion

## Actor

Authenticated user.

## Goal

Delete their SureStep account.

## Preconditions

- User is authenticated.

## Flow

1. User opens account settings.
2. User selects **Delete Account**.
3. System explains the consequences of deletion.
4. User explicitly confirms deletion.
5. System processes the account deletion according to the account's active relationships.
6. After successful deletion, the user's authentication session is ended.
7. User is returned to the authentication screen.

## Rules

### 1. Circle Owner Deletion Constraint
- Account deletion **cannot complete** while the account still owns an active Care Circle.
- The Owner must explicitly transfer ownership to an eligible Circle member or delete the Circle first through the established Circle lifecycle rules (`03-CARE-CIRCLE.md`).
- The system must not invent an automatic successor owner, automatic transfer, or undocumented emergency-handover process.

### 2. Non-Owner Member Deletion
- The system immediately revokes the account's Circle memberships, invitations, and permissions across all Circles.
- The Care Circle itself, its configuration, and other members' authorized access remain intact.
- If the deleting account is a Professional Caregiver, existing caregiver relationships and Patient assignments are terminated immediately according to `06-CAREGIVER-RELATIONSHIP.md`.

### 3. Patient Account Deletion
- Patient account deletion must not silently delete or orphan active Circle-based care, monitoring, or relationships.
- All applicable care dependencies, active monitoring, and Circle associations must be explicitly handled before deletion can complete.
- The system preserves the strict distinction between Patient-owned account/profile data and Circle-derived configuration.

### 4. Last Linked Family Member
- Deleting the last linked Family Member does **not** automatically delete the Patient or the Patient's records.
- The system must not imply that Circle-based monitoring or care access continues without an authorized mechanism.
- Applicable ownership, access, and care dependencies must be explicitly resolved before deletion completes.

### 5. General Deletion Rules
- **Atomic Operation:** Account deletion must be atomic from the user's perspective; an account cannot be left in a partially deleted state with residual access.
- **Session and Access Revocation:** All active authentication sessions, tokens, and protected authorizations are revoked immediately.
- **Invalidate Pending Actions:** All pending invitations, join requests, caregiver requests, and applications associated with the account are invalidated.
- **Audit Retention:** Authoritative audit trail records are retained according to the data lifecycle without preserving unnecessary user access to private Patient data.

## Failure Cases

- User cancels deletion.
- Account owns an active Care Circle: deletion is blocked until ownership is transferred or the Circle is deleted.
- Account has unresolved Patient care dependencies or is the last linked Family Member without resolved access.
- Deletion operation fails or network drops: operation rolls back atomically.

## Acceptance Criteria

- The account cannot be deleted accidentally.
- A cancelled deletion leaves the account unchanged.
- Account deletion cannot proceed while the user owns an active Care Circle.
- No automatic successor owner or automatic transfer is invented.
- Deleting a non-owner member revokes memberships and permissions while leaving the Circle intact.
- Deleting a caregiver account terminates active relationships and assignments.
- Deleting a Patient account explicitly requires handling care dependencies without silent orphaning.
- Deleting the last linked Family Member does not delete the Patient account and does not imply unmanaged monitoring continues.
- Pending invitations, join requests, and caregiver requests are invalidated upon deletion.
- Account deletion is atomic, terminates all sessions immediately, and prevents subsequent authentication.
- Protected information is not exposed through the deleted account.
- Immutable audit records are preserved without retaining ongoing access.

---

# 7. Session Expiry / Invalid Session

## Actor

Authenticated user.

## Goal

Prevent access when the authentication session is no longer valid.

## Flow

1. User is using SureStep.
2. Their authentication session expires or becomes invalid.
3. System detects the invalid session.
4. System prevents further protected operations.
5. User is returned to authentication.
6. User can authenticate again.

## Rules

- An expired or invalid session cannot perform protected operations.
- Session expiry does not delete persisted account data.
- An action that was not successfully submitted must not be treated as completed.

## Acceptance Criteria

- An expired session cannot access protected resources.
- An expired session cannot modify protected data.
- The user can authenticate again.
- Existing account data remains intact.

---

# 8. Identity Rules

These rules apply across SureStep.

## Unique Account Identity

A verified phone number identifies one SureStep account.

## Primary Role

Each account has one primary SureStep role:

- Patient
- Family Member
- Professional Caregiver

## Authentication vs Authorization

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to access or do?

Successfully authenticating does not automatically grant access to patient information.

Patient information access is controlled by the relevant Care Circle, patient assignment, and permissions.

## Assisted Patient Onboarding

A person helping a patient during assisted onboarding does not automatically become a Family Member account.

If the helper requires ongoing access, they must create or use their own Family Member account and connect through the appropriate Care Circle workflow.

## Account Continuity

Changing a phone number does not create a new account.

The same account retains its existing:

- Role
- Care Circle relationships
- Patient relationships
- Caregiver relationships
- Permissions
- Routines
- Memories
- Activity/history