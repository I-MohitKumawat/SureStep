# CareNet V1 Product Requirements

> **Status:** V1 requirements lock / implementation baseline
>
> This document defines what the product must do. It is the source of truth for workflow design and implementation review. It intentionally avoids prescribing frontend, API, database, or framework choices unless a behavior itself is required.
>
> **Engineering rule:** Product requirement -> workflow -> acceptance criteria -> implementation -> testing.

---

# 1. Product Model

## 1.1 Primary roles

CareNet has exactly three primary roles:

- Patient
- Family Member
- Professional Caregiver

A Patient may be onboarded in two setup modes:

- **Self:** the patient is setting up their own account.
- **Assisted:** another person is physically helping set up the patient's account.

Assisted setup does not create a family account and does not change the patient's role. If the helper wants ongoing access, they create their own Family account and connect separately.

## 1.2 Authentication

- Sign up/sign in uses phone number authentication.
- Patient accounts have their own phone number.
- Duplicate registration with an existing phone number must not create a second account.
- OTP proves phone ownership; it is not a separate Care Circle membership mechanism.
- Care Circle invitations use an invite code/link followed by an approval/acceptance workflow.

## 1.3 Product-wide principles

- Initial target market: India.
- Multiple languages are required.
- Patient UX must be simple, low-decision, and reassuring.
- Backend concepts such as Circle ownership and permissions should not be unnecessarily exposed to patients.
- Sensitive access is permission-controlled.
- Important care and safety actions are auditable.
- Required care tasks and voluntary activities are distinct.
- A frontend screen, API, database table, or agent report is not proof that a workflow works.
- V1 should prefer simple, explainable workflows over sophisticated systems.

---

# 2. Patient

## 2.1 Patient onboarding

Collect:

### About patient
- Name
- Date of birth
- Gender
- Photo
- Location

### Communication
- Preferred language
- Communication preferences

### Living situation
- Living arrangement
- Household context

### Health status
- Dementia severity
- Other health conditions

### Medications
- Current medication information
- Medication entry does not have to block onboarding if incomplete.

### Care needs
- Assistance required with daily activities

### Safety
- Wandering risk
- Other safety concerns

### Emergency contact
- Contact details
- Relationship
- Optional account linking

### Review
- Review entered information.
- Final summary/confirmation.
- Information that is not required during onboarding can be completed later.

The implementation must explicitly classify onboarding fields as required/optional and define who can edit them; it must not silently assume every field is mandatory.

## 2.2 Patient home

The patient home prioritizes:

- Orientation
- Today's routine
- Safety/help
- Familiar content

The patient should not need to understand Care Circle administration.

## 2.3 Patient routine

A patient can view their day's care routine.

Required care tasks primarily expose:
- Confirm
- Help/question

Required tasks do not have a default Skip action.

Optional activities may be skipped and must not behave like missed essential care.

### Contextual instructions

Tasks can contain step-by-step visual instructions, including photos. Medication guidance may show:
1. Where the medication is.
2. What its container/box looks like.
3. What it is and how it should be taken.

### Completion

- Patient can confirm completion.
- Authorized family/caregiver users can record completion on behalf of the patient.
- Completion records identify who recorded it.

Minimum task states:
- Not yet completed
- Ongoing/current where applicable
- Overdue
- Completed by patient
- Completed on behalf of patient

Required overdue tasks can generate alerts according to permissions.

## 2.4 Patient activities

Activities are voluntary even when surfaced inside a routine.

Initial V1 examples:
- Family-photo matching game
- Simple visual matching/shape/animal games
- Breathing guide
- Other simple activities where appropriate

V1 does not implement sophisticated cognitive assessment, clinical scoring, dementia severity scoring, or cognitive-decline prediction.

### Longitudinal activity data

Where an activity naturally produces measurable interaction data, SureStep may record basic activity telemetry as longitudinal application data.

Examples include:
- Activity type
- Attempt count
- Completion status
- Completion timestamp
- Time taken
- Basic score/result where the activity produces one
- Historical activity records across repeated sessions

For games, where available:
- Game type
- Attempt
- Score/result
- Time taken
- Completion history

For routines, the system may retain longitudinal care-activity history including:
- Scheduled occurrence
- Start time
- Completion time
- Completion status
- Overdue status
- Who recorded completion
- Repeated historical occurrences

These records are operational/activity data in V1. They must not be presented to users as:
- A dementia score
- A cognitive score
- A measure of dementia severity
- A measure of cognitive decline
- A diagnosis
- A prediction of future cognitive decline
- A clinical assessment

The purpose of collecting this data in V1 is to support the application's activity and care-history features and preserve longitudinal data that may support future research and product development.

Future research may investigate whether longitudinal routine, activity, or game-performance patterns contain useful signals for cognitive or functional trend analysis. Such research is outside the V1 product behavior and must not be represented as a validated clinical prediction capability.

Any future model intended to make health-related or clinical predictions requires separate validation, privacy protections, appropriate consent/research governance, and clinical evaluation before being presented as a clinical capability.

## 2.5 My People

My People is the patient's simple view of people connected to their care. It can include:
- Family
- Trusted people
- Professional caregivers

Member cards can show:
- Name
- Photo
- Quick call/contact

Member profiles can show:
- Name
- Photo
- Short introduction
- Contact information where appropriate
- General location where appropriate
- Memories associated with that person

### Memories

Connected people can share:
- Photos
- Short videos
- Text

Patients can view fresh and previous memories. This is a familiarity/reassurance feature, not a social network.

## 2.6 Patient Care Circle participation

The patient does not create or administer a Care Circle.

The patient **can join a Care Circle** through Settings using an invite code/link. Patient joining follows the same basic request/approval model as other members, except the patient cannot create a Circle.

The patient does not manage:
- Circle ownership
- Member permissions
- Caregiver access
- Circle administration

The patient sees the result through My People and appropriate access information.

## 2.7 Patient caregiver discovery

A self-registered patient may search for caregivers for themselves. An assisted patient should normally have caregiver discovery handled by an authorized family member rather than exposing marketplace complexity to the patient.

Caregiver discovery can filter by:
- Location/service area
- Overall experience
- Dementia experience
- Care capabilities
- Languages
- Availability
- Price/rates when such information is actually supplied

Caregiver profile can contain:
- Photo
- Bio/introduction
- Role
- Experience
- Dementia experience
- Skills/capabilities
- Qualifications/training
- Languages
- Availability
- Service area
- Capacity
- Rates if provided

Credentials and training are self-reported in V1; formal verification is deferred.

Viewing a caregiver profile does not create a relationship or expose the patient's private information.

## 2.8 Patient safety

### SOS

Patient can trigger SOS/help.

Only users with the relevant Receive SOS Alerts permission receive it. Patient receives confirmation that the SOS was sent and can call a designated contact.

Lifecycle:

**Triggered -> Active -> Someone responding -> Patient safe -> Resolved**

- A recipient can select **I'm Responding**.
- Responding does not hide the incident from other authorized recipients.
- Alert remains active until resolved.
- Resolve is distinct from merely opening/acknowledging.
- Trigger, response, and resolution are auditable.

### Safe Zone breach

Safe Zones belong to the **Care Circle**, not an individual patient.

A Circle can contain multiple Safe Zones. A zone can monitor one or multiple patients in the Circle.

V1 Safe Zones:
- Name
- Location
- Radius
- Monitored patient(s)
- Active/inactive state
- Creator/timestamps

V1 uses simple circular/radius zones rather than arbitrary polygon drawing.

If a patient leaves a monitored zone:
- Authorized safety recipients receive the alert regardless of their physical location.
- Patient receives a calm/reassuring message.
- Authorized responders can view the patient's location on the integrated map.
- Response actions include where appropriate: I'm Responding, Call Patient, Get Directions, Resolve Alert.
- Return to the zone does not automatically resolve the incident.

Location information should show freshness and, when reliably available, movement state/speed/direction. Stale location must be represented as stale rather than falsely presented as live.

No automatic 112/emergency dispatch in V1.

---

# 3. Family Member

## 3.1 Family onboarding

Family onboarding is connection-first.

After authentication, the primary first-use choices are:
- Create a Care Circle
- Join a Care Circle

Do not force detailed caregiving preference configuration before the user has connected to a patient.

Basic family profile can be completed separately and edited later.

## 3.2 Family dashboard

Once connected, Family can monitor and manage the patients they are authorized to manage.

If a family member has multiple patients, the UI supports selecting/switching the active patient context. Patient-specific actions must make the selected patient obvious to prevent accidental actions on the wrong person.

## 3.3 Patient monitoring

Authorized family members can view:
- Patient status
- Today's routine/progress
- Care updates
- Safety status
- Location when permitted

## 3.4 Patient care profile

Authorized family members can view/update relevant patient care information, including where applicable:
- Health information
- Dementia stage/severity
- Known triggers
- Comfort items
- Living situation
- Emergency contacts
- Care needs

Editing is permission-controlled and auditable.

## 3.5 Family routines

Authorized family members can:
- Create routines/tasks
- Edit routines/tasks
- Delete/remove routines/tasks
- Pause/disable routines when appropriate
- Configure required vs optional behavior
- Add contextual instructions/photos
- Monitor completion
- Record completion on behalf of patient when appropriate

Routine lifecycle should use standard care-management behavior. Changes must be auditable.

## 3.6 Location and Safe Zones

Authorized family members can:
- View patient location
- View location freshness/status
- View active Safe Zones
- Create Safe Zones
- Edit Safe Zones
- Delete/deactivate Safe Zones
- Choose monitored patient(s) where applicable
- Receive safety alerts
- Respond to safety alerts

Safe Zone alerts go to people with the appropriate safety permissions, not merely people physically present in the zone.

## 3.7 Family SOS response

Authorized family members can:
- Receive SOS
- View incident
- See who is responding
- Select I'm Responding
- Call patient
- View patient location
- Get directions
- Resolve the incident when appropriate

## 3.8 Care Circle management

Family members can create/manage a Care Circle according to their role and permissions.

The Circle owner has full Circle-management authority. Care permissions can be delegated, but permission-management authority and ownership transfer remain owner-only in V1.

Core Circle actions:
- Create Circle
- Generate invite code/link
- Regenerate invite code/link
- Accept/reject join requests
- Invite members
- Remove members
- Leave Circle when permitted
- Transfer ownership
- Delete Circle

Invite codes expire after a short period (V1 baseline: approximately 72 hours); regenerating a code invalidates the previous code.

Joining requires authentication and approval. Entering an invite code never immediately grants access to patient data.

A user has one active Care Circle in V1. Joining another requires leaving/deleting the current Circle first, subject to ownership/patient safety rules.

Owner cannot simply leave without transferring ownership or deleting the Circle.

Removal/permission revocation immediately revokes the affected access. Important membership and permission actions are recorded in Activity/audit history.

## 3.9 Care Circle permissions

Baseline family permissions:

| Capability | Owner | Delegatable |
|---|---:|---:|
| View patient care profile | Yes | Yes |
| Edit patient care profile | Yes | Yes |
| View patient location | Yes | Yes |
| Manage Safe Zones | Yes | Yes |
| Receive safety alerts | Yes | Yes |
| Respond to safety alerts | Yes | Yes |
| Manage routines | Yes | Yes |
| Manage Circle members | Yes | Yes |
| Invite members | Yes | Yes |
| Manage member permissions | Yes | Yes |
| Transfer ownership | Yes | No |
| Search/Request Caregivers | Yes | Yes |
| Manage Caregiver Relationships | Yes | Yes |
| Manage patient memories | Yes | Yes |
| View Activity/alert history | Yes | Yes |

Receive safety alerts and respond to safety alerts are separate permissions. View location is separate from receiving alerts.

## 3.10 Caregiver discovery and requirements

Family has two ways to find professional care:

### Search Caregivers

Family can search/filter caregiver profiles and initiate a care request.

### Post Care Requirements

Family can publish a care opportunity describing the care needed. The opportunity should include enough information for caregivers to decide whether to apply without unnecessarily exposing private patient data.

Possible requirement information:
- Patient/care context
- Relevant health/care needs
- Required capabilities
- Location/service area
- Expected schedule
- Availability requirements
- Other relevant care notes
- Compensation information if the family chooses to provide it

Caregivers can discover suitable opportunities and submit an **Application Note** explaining relevant experience/fit and referring the family to their profile.

Caregivers cannot freely message arbitrary families/patients. The application is the controlled first contact.

### Care relationship lifecycle

**Discover/Search or Post Requirement -> Request/Application -> Review -> Discussion -> Optional meeting -> Accept/Decline -> Circle join -> Patient assignment -> Active relationship**

Care-request discussion is narrowly scoped to the care relationship. It is not a general social messaging system.

V1 does not implement payments/subscriptions, ratings/reviews, formal credential verification, or sophisticated workforce scheduling.

## 3.11 Caregiver management after hiring

A caregiver's application acceptance does not itself grant patient data access.

After the parties agree to work together:
1. Caregiver receives/uses a Circle invite code/link.
2. Caregiver authenticates and submits a join request.
3. Circle owner/authorized member approves the request.
4. Owner/authorized member assigns the caregiver to the relevant patient.
5. Appropriate caregiver access becomes active.

In V1, a professional caregiver operates within one active Care Circle. Cross-Circle caregiver membership is deferred.

A caregiver assigned to one patient does not automatically receive another patient's care information merely because both patients are in the same Circle.

## 3.12 Caregiver relationship termination

Either side can initiate termination, but V1 does not require mutual consent.

### Caregiver-initiated

Baseline behavior:
- Caregiver requests to end the relationship.
- Provides a reason/category if appropriate.
- Caregiver-initiated termination enters a `Notice Period` state lasting seven days.
- The relationship remains active during the notice period, and existing care permissions remain in effect.
- The Family can terminate immediately at any time, subject to the existing safety-termination rules.
- At the end of seven days, the relationship automatically becomes terminated and relationship-derived access is revoked.
- The notice period does not guarantee replacement care or a safety handover.
- Record the notice, notification to the Family, effective termination date, and lifecycle transitions in the audit trail.

### Family-initiated

Family can terminate the relationship immediately. Appropriate caregiver access is revoked immediately.

### Safety exception

If continuing care creates an immediate safety/personal risk, caregiver can request immediate termination/suspension rather than waiting the normal notice period.

Termination is recorded in Activity/audit history.

## 3.13 Memories

Authorized family members can:
- Add photos
- Add short videos
- Add text memories
- Remove/manage memories they are authorized to manage

Memories remain associated with the patient rather than being a general social feed.

### Memory management permission

The `Manage Patient Memories` permission controls who may create, edit, and delete memory content for a Patient.

- The Circle Owner holds `Manage Patient Memories` by default.
- The Owner can delegate `Manage Patient Memories` to eligible Circle members through the existing permission-management mechanism.
- Revoking the permission prevents subsequent memory-management operations.
- `Manage Patient Memories` is separate from `Manage Member Permissions`; holding one does not confer the other.
- Memory-management permission does not grant additional Circle-administration, caregiver-management, or Patient-data permissions (health, location, routines, safety information).

### Default memory visibility

As an explicit V1 product decision, memory content associated with a Patient is visible by default to people currently connected to that Patient through an active Care Circle membership or active caregiver assignment. Each memory remains explicitly associated with the Patient it was shared with.

> **Gap — non-Circle connected people:** The requirements and workflows do not establish a relationship type for people connected to the Patient who are not Circle members and not assigned caregivers. If a future V1 connected-person category is introduced outside the Circle model, memory-visibility rules for that category must be explicitly defined before implementation rather than inherited automatically.

## 3.14 Activity / Alerts Center

User-facing Care Log is represented as a unified **Activity / Updates** center with visual priority for alerts.

Suggested filters:
- All
- Alerts
- Requests
- Activity

Examples:
- SOS
- Safe Zone breach
- Caregiver request/application
- Circle join request
- Routine completion
- Completion by another person
- Response actions
- Safe Zone changes
- Member/permission changes

The backend/system maintains detailed immutable audit history separately from the simplified user-facing feed.

## 3.15 Family settings

Standard account/profile/settings behavior:
- Edit personal profile
- Language
- Communication/notification preferences
- Accessibility preferences where supported
- Phone change
- Logout
- Account deletion
- Privacy/access explanation

---

# 4. Professional Caregiver

## 4.1 Caregiver onboarding/profile

Professional profile contains, where applicable:

### Personal
- Name
- Date of birth
- Gender
- Language(s)
- City
- Photo

### Professional
- Caregiver role
- Total experience
- Dementia-care experience
- Training
- Skills/capabilities
- Specializations
- Qualifications
- Languages

### Availability/service
- Preferred shifts
- Working availability
- Service city
- Service radius
- Maximum patient capacity

### Profile
- Bio
- Discoverability
- Self-reported credentials/training

Rates may be shown if supplied, but V1 does not assume a particular payment/fee model.

Caregiver can edit their own profile/settings using standard account behavior.

## 4.2 Caregiver opportunities

Caregiver home must remain useful before the caregiver has a patient.

Caregiver can:
- Browse family-posted care requirements
- Filter opportunities
- View relevant opportunity/care information
- Submit an application
- Include a short Application Note
- Withdraw a pending application
- View application status

Caregiver sees opportunities, not a directory of arbitrary patients for cold outreach.

Application states use simple lifecycle behavior:
- Pending
- Accepted
- Rejected/closed
- Withdrawn

## 4.3 Caregiver home with patients

If caregiver has one assigned patient, patient-specific care dashboard can be the default home.

If caregiver has multiple assigned patients within the same Circle, home becomes a patient-card/list view.

Each patient card should provide at-a-glance information such as:
- Patient photo/name
- Current care/routine status
- Important active alert
- Safety/location status
- Quick actions to Routine, Alerts, Location, and Patient details

The caregiver does not support multiple active Care Circles in V1.

## 4.4 Caregiver patient access

### Before relationship/assignment

Caregiver can see only non-personal information exposed through caregiver discovery/opportunities plus the relevant health/care information deliberately included in a care opportunity so they can determine whether they are qualified/interested.

They cannot access the patient's private full profile, exact location, routines, family contacts, or Circle data before authorization.

### After assignment

A linked caregiver receives the complete care information necessary for the assigned patient, including relevant health/care information and the complete routine.

The caregiver can:
- View assigned patient profile/care information
- View complete routine
- View patient location when permitted
- View safety status
- View designated family contacts when permitted
- Receive relevant patient safety alerts
- Respond to SOS/safety incidents

Access to other patients remains separate and is not automatically inherited from Circle membership.

## 4.5 Caregiver routine

A caregiver assigned to a patient receives access to that patient's **complete daily routine** by default.

Multiple caregivers assigned to the same patient, including day/night caregivers, can see the complete routine regardless of shift.

Routine UI uses the same core daily routine model as the patient:
- Entire day remains available.
- Current/ongoing task is emphasized.
- Nearby tasks can be browsed/scrollable.
- Quick filters can switch between views such as Upcoming, Ongoing, Completed, and Overdue.

Caregiver can, according to permission:
- View instructions
- Mark a task completed
- Mark completion on behalf of patient
- See who completed a task
- Edit task/instruction details if granted
- Add routine/task if granted
- Remove routine/task if granted

Default caregiver authority is execution, not routine administration. Family/owner can delegate routine-management permissions when the caregiver is responsible for managing the care plan.

Every caregiver completion records that the caregiver performed/recorded the action.

Routine changes and completion actions are auditable.

## 4.6 Caregiver safety

A caregiver receives patient-care-focused safety alerts for assigned patients, including:
- SOS
- Safe Zone breaches
- Other safety events explicitly enabled by their permissions

They do not automatically receive Circle-administration notifications merely because they are a caregiver.

Caregiver response actions can include:
- View incident
- View patient location
- Call patient
- Get directions
- I'm Responding
- Resolve where appropriate

## 4.7 Caregiver Circle joining

After a family accepts the caregiver relationship and the parties have met/decided to proceed:

**Accepted -> Circle invite -> Caregiver requests to join -> Owner/authorized member approves -> Patient assignment -> Care access active**

Joining the Circle and becoming a caregiver are separate states. No patient data access is granted merely because an application was accepted.

If the caregiver never completes Circle joining, the relationship remains **Accepted / Awaiting Circle Join** and patient access is not activated.

## 4.8 Caregiver termination

See Family caregiver-management lifecycle. Caregiver can initiate a 7-day notice-period termination, subject to immediate safety exceptions.

When access ends, patient-specific data access is revoked appropriately.

## 4.9 Caregiver reporting

Caregiver can report:
- Inappropriate behavior
- Safety concerns
- Harassment
- Fraud/misrepresentation
- No-show
- Payment disputes
- Serious care disputes

Reports go to the platform for review. Reporting does not automatically terminate an account.

## 4.10 Caregiver communication

V1 does not create a general-purpose social/chat platform.

Care-request communication is limited to the care-request/connection workflow. General ongoing messaging is deferred unless later validated as necessary.

---

# 5. Care Circle Lifecycle

The Care Circle is the underlying membership/access container.

## Creation

- Family or professional caregiver can create a Circle.
- Patient cannot create one.
- Creator becomes Owner.
- Circle has a name and optional category.
- V1 supports one active Circle per user.

## Invitation

- Owner/authorized inviter generates invite link/code.
- Code is short-lived (baseline ~72 hours).
- Regeneration invalidates the previous code.
- Invitee must authenticate if necessary.
- Invite code entry does not grant access.

## Join request

- Invitee sees minimal invitation information.
- Invitee submits join request.
- Owner or authorized member with membership-management authority approves/rejects.
- Before approval, invitee cannot view patient/member/location/health data.

## Patient join

Patient uses Settings -> Join Care Circle and follows the same invitation/request/approval pattern. Patient cannot create a Circle.

## Membership

Every member has:
- Circle membership
- Appropriate role/context
- Permissions
- Optional patient assignment where relevant

## Removal / leaving

- Owner/authorized member can remove members.
- Non-owner members can leave voluntarily.
- Access revokes immediately.
- Action is auditable.

Owner cannot simply leave; ownership must transfer or the Circle must be deleted.

Patient departure/removal must use an explicit safety-aware workflow rather than silently breaking care access.

## Ownership transfer

- Owner can transfer ownership to another eligible member.
- Previous owner remains a member unless removed.
- Transfer is auditable.

## Deletion

- Owner can delete the Circle.
- Active Circle access is revoked.
- Patient/caregiver relationships are not silently preserved as if still active.
- Destructive action requires explicit confirmation.
- Historical audit records should remain appropriately preserved rather than becoming mutable user content.

---

# 6. Permission Model

Permissions are evaluated at the time of access/action and should take effect immediately when revoked.

Important permission principles:

- Circle membership does not equal unlimited access.
- Patient assignment is separate from Circle membership.
- Location access is separate from safety-alert receipt.
- Receiving SOS alerts is separate from responding.
- Routine-management authority is separate from routine viewing/execution.
- `Manage Member Permissions` is delegatable: the Owner can grant this permission to eligible Circle members. A member holding it can grant or revoke other delegatable permissions for Circle members, but cannot grant themselves additional authority, cannot grant Owner-only permissions, and cannot grant or revoke `Manage Member Permissions` itself — only the Owner can do that. Ownership transfer, Circle deletion, and removal of the Owner remain Owner-only.
- Access to another patient is explicitly granted rather than inherited from a caregiver's Circle membership.

After permission revocation:
- New access is denied immediately.
- Existing UI should not continue exposing data after authorization state refresh.
- Important changes are recorded in Activity/audit history.

---

# 7. Location & Safe Zone Lifecycle

## Safe Zone CRUD

Authorized user can:
- Create
- View
- Edit
- Activate/deactivate
- Delete

Safe Zones belong to the Care Circle, not an individual Patient. A Safe Zone may monitor one or multiple Patients belonging to that Circle. Patient associations are monitoring configuration, not zone ownership.

If one Patient leaves or is removed from the Circle, that Patient is removed from the zone's monitoring configuration. If other monitored Patients remain, the zone stays active for them. If no monitored Patients remain, monitoring is deactivated while retaining the zone configuration unless the Owner deletes the zone.

Removing a Patient, editing a zone, or deactivating a zone must not silently resolve an existing safety alert; existing alerts remain governed by the Safety alert lifecycle. Monitoring does not continue for a Patient after Circle-based monitoring access ends. Alert recipients are derived from Circle permissions, not physical presence.

For the same patient, overlapping zones should be avoided in V1 to prevent ambiguous alerts.

## Location states

System must distinguish at least:
- Current/recent location
- Stale location
- Location unavailable

Do not fabricate a live location when the device is offline, GPS is unavailable, permission is revoked, or the last update is too old.

## Breach

**Safe -> Breach detected -> Alert delivered -> Response -> Patient safe/return -> Human resolves**

Return to the Safe Zone is an update, not automatic resolution.

If a zone is edited/deleted while a breach is active, the incident remains an auditable historical event and the UI must clearly explain its relationship to the changed zone.

---

# 8. Alert Lifecycle

All important alerts follow a consistent lifecycle where applicable:

**Triggered -> Delivered/Active -> Viewed -> Responding (optional) -> Resolved**

Not every alert requires every state.

Alerts should not disappear simply because a user opened them.

Important actions remain in Activity/audit history.

Failure cases such as offline recipients, notification delivery failure, stale location, and duplicate taps must not create contradictory incident state.

V1 does not implement automatic emergency dispatch/escalation.

---

# 9. Activity, Notifications & Audit

## User-facing Activity / Updates

Unified center:
- All
- Alerts
- Requests
- Activity

Alerts receive highest visual priority.

Users can open an item and navigate to the relevant object/incident.

Read/unread is a presentation state; reading an alert does not resolve the underlying event.

## Audit history

System maintains an auditable record of important actions, including:
- Routine completion and actor
- Routine edits
- Permission changes
- Safe Zone changes
- SOS trigger/response/resolution
- Membership changes
- Ownership transfer
- Patient assignment changes
- Relationship termination
- Other significant care/safety actions

Audit records are not ordinary user-editable content.

---

# 10. Account Lifecycle

For every role:

- Sign up
- Verify phone
- Sign in
- Log out
- Change phone number
- Delete account

Duplicate phone registration must not create duplicate accounts.

Account deletion must explicitly handle active Circle memberships, patient/caregiver relationships, pending requests, permissions, and owned Circles rather than leaving orphaned access.

Destructive account actions require confirmation.

---

# 11. Cross-Product Edge Cases

The implementation must account for at least the following classes of interaction:

### Identity
- Existing phone number
- Expired/invalid OTP
- Duplicate submission
- Phone change
- Account deletion

### Circle
- Expired invite
- Regenerated invite
- Duplicate/pending join request
- Rejected request
- Member removal
- Member leaving
- Ownership transfer
- Circle deletion
- Patient joining/leaving/removal
- User attempting to join a second Circle

### Caregiver relationship
- Accepted but not yet in Circle
- Application withdrawn/rejected/closed
- Caregiver never joins
- Patient assignment changed
- Caregiver termination notice
- Immediate safety termination
- Family immediate termination
- Access revocation

### Routine
- Simultaneous completion
- Patient vs caregiver completion
- Task becomes overdue
- Task edited/deleted while active
- Permission removed during use
- Multiple caregivers acting on same task

### Location/safety
- GPS disabled
- Location permission revoked
- Offline device
- Stale location
- Low battery/device unavailable
- False GPS bounce
- Zone edited/deleted during breach
- Multiple patients monitored by one zone
- Multiple zones

### Alerts
- Notification delivery failure
- Multiple responders
- No responder
- Alert opened but not resolved
- Patient returns to zone
- SOS and Safe Zone breach occurring together

### Multi-patient family/caregiver
- Family switches active patient
- Caregiver assigned to only one patient in a Circle
- Wrong-patient action prevention
- Caregiver access to another patient denied unless explicitly granted

### Privacy/security
- Unlinked user attempting patient access
- Removed member using an old link/session
- Expired invitation reuse
- Unauthorized location access
- Unauthorized health/routine access
### Longitudinal activity data

Activity, game, and routine telemetry is patient-associated data and must be protected by the same authorization boundaries applicable to the underlying patient data.

Recording telemetry does not grant additional access to the patient.

A user may only access longitudinal activity/routine data when their existing role, patient assignment, Circle membership, and permissions authorize access to that underlying patient information.

V1 must not expose raw telemetry to unauthorized Circle members, caregivers, or other users merely because they belong to the same Circle.

Research or future ML use of this data is not part of V1 user-facing functionality.

### Reliability
- Request timeout
- Double tap/submission
- App closes during mutation
- Network disappears after submission
- Server succeeds but response is lost
- Stale client data
- Two devices modifying the same resource

---

# 12. V1 Deferred / Excluded

Do not implement unless V1 scope is explicitly changed:

- Doctor/clinical role and clinical export
- Payments/subscriptions/commission mechanics
- AI voice cloning/voice messages
- General-purpose social chat
- Ratings/reviews
- Formal credential verification
- Sophisticated workforce/shift optimization
- Payroll/timesheets
- Caregiver wellbeing logs
- Complex shift handovers
- Sophisticated cognitive assessment/scoring backend
- Automatic 112/emergency dispatch
- Nearby public/third-party emergency caregiver response
- Cross-Circle caregiver membership
- Arbitrary polygon Safe Zones
- Cognitive decline prediction from patient activity/routine/game data
- Clinical interpretation of longitudinal activity or routine telemetry
- Patient-facing cognitive/progression scores derived from telemetry
- Automated dementia diagnosis or severity classification
- Clinical decision-making based on V1 activity telemetry

Business monetization is deliberately undecided and does not block V1 product workflows.

---

# 13. Workflow Acceptance Standard

A feature is **not complete** because:
- an API exists;
- a database table exists;
- a frontend screen exists;
- an endpoint returns 200;
- an agent reports it as implemented.

A workflow is complete only when the intended actor can perform the entire journey and:

1. Correct data is created/updated.
2. Correct user sees the correct result.
3. Unauthorized users cannot access it.
4. Notifications/alerts occur where required.
5. State transitions are correct.
6. Relevant actions are auditable.
7. Failure/edge states are handled without corrupting data or access.

---

# 14. Core V1 End-to-End Workflows

These are the journeys that must work end-to-end before V1 is considered functionally complete.

## Patient
1. Phone authentication -> onboarding -> patient home.
2. Patient views today's routine -> completes required task.
3. Patient asks for help on a routine.
4. Patient views My People -> calls/contact.
5. Patient views memories.
6. Patient joins a Circle via Settings -> invite -> approval.
7. Patient triggers SOS -> recipient responds -> incident resolved.
8. Patient leaves Safe Zone -> alert -> responder -> location/directions -> resolution.
9. Patient updates permitted profile/settings.
10. Patient deletes account.

## Family
1. Phone authentication -> Create/Join Circle.
2. Create Circle -> invite member -> member requests -> approval -> membership.
3. Join Circle -> request -> approval.
4. Connect/manage patient -> view dashboard.
5. Create/edit/complete/monitor routine.
6. Create/edit/manage Safe Zone -> breach -> respond -> resolve.
7. View/respond to SOS.
8. Search caregiver -> request -> discuss -> meeting -> accept.
9. Post care requirement -> caregiver applies -> review -> discuss -> accept.
10. Invite accepted caregiver -> Circle join -> patient assignment -> active care access.
11. Grant/revoke caregiver permissions.
12. Manage memories.
13. Transfer ownership/remove member/leave/delete Circle according to rules.
14. Terminate caregiver relationship.
15. View Activity/Alerts.
16. Manage multiple patients without cross-patient leakage.
17. Delete account safely.

## Professional caregiver
1. Phone authentication -> professional profile.
2. Browse opportunities -> apply with Application Note.
3. Track application -> accepted.
4. Join Circle -> owner approval -> patient assignment.
5. View assigned patient care profile.
6. View complete daily routine.
7. Complete task on behalf of patient -> attribution recorded.
8. Use delegated routine-management permissions if granted.
9. Receive/respond to SOS/Safe Zone alerts.
10. View permitted location/family contacts.
11. Manage multiple assigned patients within one Circle.
12. End relationship with notice/safety exception.
13. Report a concern/problem.
14. Manage profile/settings.

---

# 15. Implementation Handoff Rules

When converting this document into engineering tasks:

- Do not ask an agent to "fix the app" globally.
- Give one workflow or acceptance criterion at a time.
- For an observed failure, provide: expected behavior, observed behavior, reproduction, and scope.
- Agent must identify root cause before modifying unrelated code.
- API/DB/frontend must be evaluated against the product workflow, not the other way around.
- Existing code that contradicts this document is considered an implementation gap, not a requirement change, unless explicitly re-decided.
- Keep the docs/requirements source untouched when requested; implementation work should not silently rewrite product requirements.

---

# 16. V1 Definition of Done

V1 is ready for functional verification when:

- All three roles can authenticate.
- Patient, Family, and Caregiver core journeys work end-to-end.
- Care Circle membership and permission boundaries are enforced.
- Patient-specific access is correctly isolated.
- Routines work for patient/family/caregiver according to permissions.
- Safe Zones, location, SOS, alerts, response, and resolution work end-to-end.
- Caregiver discovery/application/connection works end-to-end.
- Memories/My People work at the intended scope.
- Activity/audit records important care and safety actions.
- Account deletion and access revocation do not leave unauthorized access behind.
- Major offline/stale/duplicate-action edge cases have defined behavior.
- Product behavior matches this document before implementation is declared complete.

---

# 17. Decisions Deliberately Left for Validation / Future

These are not blockers for the product requirements baseline:

- Exact business monetization model.
- Exact caregiver compensation/fee mechanics.
- Formal caregiver credential verification.
- Ratings/reviews.
- Whether general ongoing in-app caregiver/family messaging is needed.
- Caregiver notes/structured care concerns.
- Formal caregiver assessment/checklist.
- Advanced shift handover workflows.
- Advanced emergency escalation.
- Cross-Circle caregiver work.
### Longitudinal Data / Future AI

- Whether longitudinal routine-completion data can provide useful signals about changes in functional behavior.
- Whether activity/game performance data can provide useful longitudinal signals.
- Which activity/game metrics are meaningful enough to retain for future analysis.
- Whether individual patient baselines should be established from longitudinal data.
- Whether changes/trends in routine adherence, activity participation, completion time, or game performance should be surfaced to caregivers.
- Whether longitudinal data can support research into cognitive or functional decline.
- Whether machine-learning models can identify useful predictive patterns from longitudinal activity and routine data.
- What outcomes such models should predict and how those outcomes should be validated.
- Appropriate privacy, consent, research-governance, and ethical requirements for future ML/research use.
- Whether any future model is sufficiently validated to be presented as a clinical capability.
- Whether future versions should provide caregiver-facing insights derived from longitudinal data.
- Any clinical interpretation, diagnosis, dementia severity assessment, or cognitive-decline prediction derived from these data is outside V1.


These should be validated later rather than invented as requirements now.
