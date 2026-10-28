# Workflow: Account and Settings

## Purpose

Allow users to manage their own account information, preferences, and product settings without bypassing the authorization rules of other SureStep workflows.

Settings control the user's account and available preferences. They do not independently grant access to Patient data, Care Circles, caregivers, routines, location, safety information, or other protected functionality.

---

# 1. Open Account and Settings

## Actor

Any authenticated user.

## Goal

View and manage settings available to their account and role.

## Preconditions

- User has an authenticated SureStep account.

## Flow

1. User opens Account/Settings.
2. System identifies the authenticated account and primary role.
3. System displays settings available to that account.
4. User selects a setting.
5. System verifies that the user is allowed to modify that setting.
6. System saves the change.
7. Updated behavior takes effect according to the relevant workflow.

## Rules

- Settings are account-specific unless explicitly defined otherwise.
- A setting must not change the user's primary role.
- Settings must not bypass Circle authorization.
- Settings must not directly grant caregiver access.
- Settings must not directly grant location or safety access.
- Settings must not establish a caregiver relationship.
- Settings must not create Patient assignment.
- Settings must not modify another user's account.

---

# 2. Manage Profile Information

## Actor

Authenticated user.

## Goal

Update their own profile information.

## Flow

1. User opens Profile.
2. System displays editable profile information.
3. User changes one or more fields.
4. System validates the changes.
5. System saves the updated information.
6. Updated information is reflected wherever that profile information is legitimately displayed.

## Rules

- Users can modify their own permitted profile information.
- A user cannot modify another user's profile through their own settings.
- Patient clinical/care information follows the Patient workflow and its authorization rules rather than being treated as ordinary account-profile data.
- Changes to information used by other workflows must not silently invalidate existing relationships or permissions unless that workflow explicitly defines such behavior.

---

# 3. Change Phone Number

Changing the authentication phone number follows the Identity workflow.

## Flow

1. User enters a new phone number.
2. System checks whether the new number is already associated with another SureStep account.
3. If already registered:
   - change is rejected;
   - existing account remains unchanged.
4. If available:
   - verification is sent to the new number.
5. If verification fails or the user abandons the process:
   - old number remains active;
   - account remains unchanged.
6. If verification succeeds:
   - new number becomes the account's authentication identifier;
   - old number no longer authenticates to the account.
7. System completes the change atomically.

## Rules

- A phone number cannot authenticate to two SureStep accounts.
- The account must never enter a partially changed identity state.
- Changing the phone number does not create a new account.
- Existing Circle membership, caregiver relationships, assignments, permissions, routines, and Patient data remain associated with the same account.

---

# 4. Language and Localization

## Actor

Authenticated user.

## Goal

Select their preferred language.

## Flow

1. User opens language settings.
2. System displays supported languages.
3. User selects a language.
4. System saves the preference.
5. Supported interface content uses the selected language.

## Rules

- Language preference belongs to the individual account.
- Changing language does not change care data or authorization.
- Patient preferred language established during onboarding can be updated through the appropriate Patient profile/settings flow.
- Unsupported languages cannot be selected.

---

# 5. Patient Self-Management Setting

This setting applies specifically to Patient routine-management capability.

## Actor

Patient or authorized Family Member, according to the Patient Care workflow.

## Flow

### Self Patient

1. Self-registered Patient has Routine Management enabled by default.
2. Patient can use the permitted routine-management operations.

### Assisted Patient

1. Assisted Patient has Routine Management disabled by default.
2. Authorized Family Member opens the relevant Patient capability setting.
3. Family Member enables or disables Patient Routine Management.
4. System saves the capability state.
5. If enabled, Patient can perform the permitted routine-management operations.
6. Family Member retains their existing management authority.

## Rules

- This setting changes who may perform permitted routine-management operations.
- It does not change the Patient's Self/Assisted classification.
- It does not remove Family Member access.
- It does not grant the Patient Circle-administration authority.
- It does not grant caregiver-management authority.
- It does not grant safety-setting authority.
- Exact routine permissions remain governed by the Patient Care workflow.

---

# 6. Notification Preferences

## Actor

Authenticated user.

## Goal

Control supported notification preferences.

## Flow

1. User opens Notification Settings.
2. System displays notification preferences available to that account.
3. User changes a preference.
4. System validates that the preference can be changed.
5. System saves the preference.
6. Future notifications use the updated preference.

## Rules

- Notification preferences control delivery/presentation where supported.
- They do not change whether the user is authorized to receive protected information.
- A user cannot use notification settings to subscribe to another user's alerts.
- Disabling a notification channel does not revoke the underlying permission or relationship.
- Safety-critical notification behavior must follow the Safety workflow and its defined delivery requirements rather than being silently disabled by a generic preference.

---

# 7. Location Permission

Location permission is governed by the Location and Safe Zones workflow.

## Actor

Patient or other supported user.

## Goal

Control whether the application can collect location information where the product supports user-controlled location access.

## Flow

1. User opens location settings.
2. System displays the current application/location permission state.
3. User changes the permission where supported.
4. System records the resulting state.
5. Location collection and dependent functionality respond according to the Location workflow.

## Rules

- Application/device location permission and Circle authorization to view location are separate concepts.
- Granting device location permission does not automatically grant another user access to the location.
- Revoking location collection does not automatically delete historical data.
- Location unavailable/stale behavior follows the Location and Safe Zones workflow.
- A user cannot use Settings to grant another user location access.

---

# 8. Care Circle Access from Settings

## Actor

Patient.

## Goal

Join an existing Care Circle.

## Flow

1. Patient opens Circle settings.
2. Patient chooses the option to join a Circle.
3. Patient enters an invitation code or follows an invitation link.
4. System authenticates the Patient if necessary.
5. System validates the invitation.
6. Patient explicitly accepts the invitation.
7. System creates the appropriate membership request/state according to the Care Circle workflow.
8. Circle approval occurs according to Circle rules.

## Rules

- Patient cannot administer the Circle from Settings.
- Joining a Circle does not automatically grant unrestricted access to Circle data.
- Patient cannot silently add themselves to a Circle without the invitation/consent process.
- Settings do not provide a shortcut around Circle membership authorization.

---

# 9. Caregiver Access from Settings

Settings does not independently establish caregiver relationships.

## Rules

- Professional Caregiver discovery and requests use the Caregiver Discovery workflow.
- Relationship establishment uses the Caregiver Relationship workflow.
- Patient assignment uses the Caregiver Relationship workflow.
- Circle membership uses the Care Circle workflow.
- Settings may provide navigation to these features but does not replace their authorization/state transitions.

---

# 10. Account Logout

## Actor

Authenticated user.

## Goal

End the current authenticated session.

## Flow

1. User selects Logout.
2. System invalidates/ends the current session according to the Identity workflow.
3. User is returned to the unauthenticated entry point.
4. Protected application data is no longer accessible through that session.

## Rules

- Logout affects the current session.
- Logout does not delete the account.
- Logout does not remove Circle membership.
- Logout does not terminate caregiver relationships.
- Logout does not delete Patient data.
- Logout does not disable configured safety functionality.

---

# 11. Account Deletion

## Actor

Account owner.

## Goal

Permanently delete their SureStep account according to the account lifecycle rules.

## Preconditions

- User is authenticated.
- User explicitly confirms account deletion.

## Flow

1. User opens Account Settings.
2. User selects Delete Account.
3. System explains the consequences of deletion.
4. User explicitly confirms.
5. System processes dependent relationships and access according to the relevant workflows.
6. Account is deleted/deactivated according to the defined retention policy.
7. Active session is terminated.
8. Deleted account can no longer authenticate.

## Rules

### 1. Circle Owner Deletion
- Account deletion **cannot complete** while the account still owns an active Care Circle.
- The Owner must explicitly transfer ownership to an eligible Circle member (`03-CARE-CIRCLE.md`) or delete the Circle first through the established Circle lifecycle.
- The system must not invent an automatic successor owner, automatic transfer, or undocumented emergency-handover process.

### 2. Non-Owner Member Deletion
- The system immediately revokes the account's memberships, invitations, and permissions across all Care Circles.
- The Circle and other members' authorized access remain intact.
- If the account is a Professional Caregiver, active relationships and assignments are terminated immediately according to `06-CAREGIVER-RELATIONSHIP.md`.

### 3. Patient Account Deletion
- Deleting a Patient account must not silently delete or orphan active Circle-based care, monitoring, or relationships.
- All applicable care dependencies and Circle associations must be explicitly resolved before deletion completes.
- Preserves the strict distinction between Patient-owned account data and Circle-derived configuration.

### 4. Last Linked Family Member
- Deleting the last linked Family Member does **not** automatically delete the Patient or the Patient's records.
- The system must not imply that Circle-based monitoring or care access continues without an authorized mechanism.
- Applicable ownership, access, and care dependencies must be explicitly resolved.

### 5. General Deletion Rules
- Invalidate all pending invitations, join requests, caregiver requests, and applications associated with the deleted account.
- Revoke all active sessions and protected authorizations immediately.
- Retain necessary immutable audit history without retaining unnecessary access to private Patient data.
- Account deletion must be atomic from the user's perspective: no half-deleted account with unintended residual access remaining.

---

# 12. Session Expiry and Invalid Session

## Actor

System.

## Goal

Prevent access through an expired or invalid authentication session.

## Flow

1. User attempts to access a protected feature.
2. System validates the session.
3. If the session is valid, request continues.
4. If the session is expired or invalid:
   - protected request is rejected;
   - user is returned to authentication;
   - no protected data is exposed.

## Rules

- Session validity does not determine authorization.
- A valid session does not guarantee access to every feature.
- Authorization must be evaluated separately.
- A user whose Circle membership or caregiver permissions were revoked must not regain access merely because their authentication session remains valid.

---

# 13. Settings and Authorization Boundary

Settings provide configuration; they are not an authorization bypass.

The following must remain in their owning workflows:

| Capability | Owning workflow |
|---|---|
| Authentication | 01 — Identity |
| Patient onboarding/profile | 02 — Patient Onboarding |
| Circle membership/permissions | 03 — Care Circle |
| Routine management & Home dashboards | 04 — Patient Care |
| Caregiver profile onboarding, discovery & care requirements | 05 — Caregiver Discovery |
| Caregiver relationship lifecycle & reporting | 06 — Caregiver Relationship |
| SOS/Safe Zone safety | 07 — Safety |
| Location/Safe Zones | 08 — Location and Safe Zones |
| Memories/activities & My People | 09 — Memories and Activities |
| Notifications/activity | 10 — Notifications and Activity |
| Account/preferences | 11 — Account and Settings |

Settings may provide navigation to these capabilities, but the owning workflow remains authoritative for state changes and permissions.

---

# 14. Failure and Edge Cases

### Phone number already registered

Reject the change and leave the account unchanged.

### Phone verification abandoned

Keep the existing phone number active.

### Session expires during a settings change

Do not apply a partially completed protected change. User must authenticate again.

### User loses authorization while Settings is open

The next protected operation must use the current authorization state rather than the state that existed when Settings was opened.

### Account deletion interrupted

The system must not leave the account in an ambiguous partially deleted state. Account lifecycle processing must be atomic or resumable with an explicit final state.

### Network failure

Do not display a setting as successfully changed unless the server has accepted and persisted the change.

---

# 15. Acceptance Criteria

- Users can access settings appropriate to their account.
- Users can modify only their own permitted account information.
- Phone-number changes follow the Identity workflow exactly.
- Language preference can be changed without affecting authorization.
- Assisted Patient Routine Management is disabled by default and can be enabled by an authorized Family Member.
- Notification preferences cannot grant notification permissions.
- Location settings cannot grant another user location access.
- Patient Circle joining follows the Care Circle invitation/consent workflow.
- Settings cannot directly establish caregiver relationships or assignments.
- Account deletion explicitly confirms the action and cannot complete while the account owns an active Care Circle.
- No automatic successor owner or automatic transfer is invented.
- Deleting a non-owner member revokes memberships and permissions while leaving the Circle intact.
- Deleting a caregiver account terminates active relationships and assignments.
- Deleting a Patient account explicitly requires handling care dependencies without silent orphaning.
- Deleting the last linked Family Member does not delete the Patient account and does not imply unmanaged monitoring continues.
- Account deletion is atomic, terminates all sessions immediately, and prevents subsequent authentication.
- Expired sessions cannot access protected data.
- Settings never bypass feature-specific authorization.
- No setting silently changes Circle membership, caregiver relationship, Patient assignment, safety responsibility, or protected-data access.