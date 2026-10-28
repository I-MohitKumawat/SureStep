# Workflow: Caregiver Discovery

## Purpose

Allow a Patient or Family Member to discover Professional Caregivers, evaluate their profiles, and initiate a caregiver request.

This workflow covers **discovery, evaluation, and initial interest**.

It does **not** establish final hiring, an active caregiver relationship, Patient assignment, or Patient-care access.

The caregiver relationship is established only through the subsequent workflow in `06-CAREGIVER-RELATIONSHIP.md`.

---

# 0. Professional Caregiver Onboarding and Profile Management

## Actor

Professional Caregiver.

## Goal

Create, maintain, and configure a professional caregiver profile for discovery while controlling visibility.

## Profile Fields

A Professional Caregiver profile consists of the following attributes:

- **Name** (Full name or preferred professional name)
- **Professional role** (e.g., Certified Nursing Assistant, Home Health Aide, Dementia Companion)
- **Short biography** (Summary of background and approach)
- **General experience** (Years in caregiving)
- **Dementia-care experience** (Specific experience with memory care)
- **Qualifications and training** (Self-reported certifications, coursework, degrees)
- **Skills** (e.g., mobility assistance, behavioral de-escalation, meal preparation)
- **Languages** (Spoken languages)
- **Availability** (Weekly schedule, shift preferences, part-time/full-time)
- **Service area** (City, geographical region, travel radius)
- **Capacity** (Maximum active patient load)
- **Rates** (Hourly/shift rate information, where supplied)
- **Discoverability setting** (`Enabled` or `Disabled`)

## Required Fields for Discoverability

To protect family confidence and maintain directory quality, a caregiver **must complete all of the following seven required fields** before discoverability can be enabled:

1. Name
2. Professional role
3. Short biography
4. General experience
5. Languages
6. Service area
7. Availability

Other profile fields (dementia-care experience, qualifications and training, skills, capacity, rates) may be left incomplete without preventing the profile from being saved.

## Rules

- **Undiscoverable by default:** A newly registered caregiver profile has Discoverability set to `Disabled` by default. The caregiver does not appear in search results or browse lists.
- **Discoverability enablement:** The caregiver must explicitly toggle Discoverability to `Enabled`. The system validates that all 7 required fields are present; if any required field is missing or invalid, discoverability cannot be enabled and clear field-level feedback is provided.
- **Self-reported qualifications:** Qualifications and training are strictly self-reported in V1. No formal independent verification process exists, and no `Verified` qualification status or badge is displayed.
- **Caregiver self-management:** Caregivers can edit their own profile fields and discoverability setting at any time.
- **Access boundary:** Creating, saving, or enabling a professional profile does **not** grant any Patient-data access, does not create Circle membership, and does not establish a caregiver relationship.

## Failure / Validation Cases

- **Attempting to enable discoverability with incomplete required fields:** The toggle is blocked; system highlights the missing required fields.
- **Profile saved with optional fields empty:** Profile is saved successfully. Caregiver remains discoverable if required fields are satisfied and discoverability is enabled.
- **Disabling discoverability:** Caregiver is immediately removed from search results and opportunity browse directories; existing pending requests or active relationships remain governed by their respective lifecycles.

---

# 1. Open Caregiver Discovery

## Actor

- Patient
- Family Member

## Goal

Find Professional Caregivers who may be suitable for the required care.

## Preconditions

- User has an authenticated SureStep account.
- For a Family Member: User holds the canonical `Search/Request Caregivers` permission for the target Patient within the active Care Circle.
- For a Patient: Patient self-discovery is governed by the Patient's own access rules (self-registered Patients can search for themselves; assisted Patients have discovery handled by an authorized Family Member with `Search/Request Caregivers`).
- Circle membership alone does not grant caregiver-discovery authority.

## Flow

1. User opens Caregiver Discovery.
2. System displays eligible Professional Caregivers.
3. User can search or filter caregivers.
4. User selects a caregiver.
5. System opens the caregiver's discovery profile.

## Rules

- Only Professional Caregiver accounts appear as caregiver results.
- Patients and Family Members cannot appear as Professional Caregiver results.
- Discovery does not automatically grant access to caregiver-private information.
- A caregiver does not become associated with a Patient merely by appearing in search results.

---

# 2. Search Caregivers

## Actor

- Patient
- Family Member

## Goal

Find caregivers matching specific care requirements.

## Flow

1. User enters a search query.
2. System searches eligible Professional Caregiver profiles.
3. System displays matching caregivers.
4. User can open a caregiver profile.

## Searchable Information

Search may use information explicitly exposed for discovery, including:

- Name
- Professional skills
- Care specialties
- Experience
- Languages
- Service area
- Availability
- Other approved discovery attributes

## Rules

- Search must not expose private account information.
- Search does not contact caregivers.
- Search does not create a caregiver request.

---

# 3. Filter Caregivers

## Actor

- Patient
- Family Member

## Goal

Narrow caregiver results to suitable candidates.

## Flow

1. User opens filters.
2. User selects one or more filters.
3. System applies the filters.
4. Matching caregivers are displayed.
5. User can remove individual filters or clear all filters.

## Possible Filters

V1 may filter by:

- Care specialty
- Experience
- Language
- Service area
- Availability
- Other caregiver attributes explicitly supported by V1 requirements

## Rules

- Filters operate only on information exposed for discovery.
- Filtering does not contact caregivers.
- Filtering does not create a caregiver relationship.

---

# 4. View Caregiver Profile

## Actor

- Patient
- Family Member

## Goal

Evaluate a Professional Caregiver before initiating a request.

## Flow

1. User selects a caregiver.
2. System displays the caregiver's discovery profile.
3. User reviews available information.
4. User can return to search results or initiate a caregiver request.

## Profile Information

The profile may expose:

- Name
- Profile photo
- Professional role
- Skills
- Relevant experience
- Care specialties
- Languages
- Service area
- Availability
- Professional qualifications
- Other approved professional information

## Privacy Rules

The profile must not expose:

- Phone number
- Private address
- Private contact information
- Patient information belonging to another Circle
- Internal account information
- Private caregiver data not marked for discovery

Direct contact information is not exposed merely because a caregiver is discoverable.

---

# 5. View Caregiver Qualifications

## Actor

- Patient
- Family Member

## Goal

Evaluate the caregiver's professional background.

## Flow

1. User opens the qualifications section.
2. System displays qualifications and professional information available for discovery.
3. User reviews the information.

## Qualification Display Rules

All qualifications and training information in V1 are self-reported by the caregiver.

SureStep does not independently verify qualifications in V1. Formal credential verification is deferred.

- All displayed qualifications must be clearly identified as self-reported.
- No qualification may receive a "Verified" or equivalent label.
- SureStep must not imply that any qualification has been independently checked.
- Lack of a verification label does not mean the qualification is false; it means SureStep has not checked it.

Formal credential verification remains in the future-decisions section and must not be implemented as V1 behavior.

---

# 6. Initiate Caregiver Request

## Actor

- Patient
- Family Member

## Goal

Express interest in engaging a Professional Caregiver.

## Patient Request

A Patient requests care **for themselves**.

A Patient does not select another Patient as the subject of their request.

For a Patient receiving assisted setup, the Patient remains the Patient/account owner. Assisted setup does not transfer ownership to the Family Member.

## Family Request

A Family Member may request a caregiver only for a Patient that the Family Member is authorized to manage.

The Family Member must explicitly select the Patient for whom the request is being made.

## Flow

1. User opens the caregiver profile.
2. User selects **Request Caregiver**.
3. System determines the Patient associated with the request:
   - Patient → the requesting Patient.
   - Family Member → a Patient the Family Member is authorized to manage.
4. System displays the request details.
5. User confirms the request.
6. System validates the caregiver and requester.
7. System creates the caregiver request.
8. System records:
   - Requester
   - Patient
   - Care Circle, when applicable
   - Professional Caregiver
   - Creation time
   - Current request state
9. System notifies the Professional Caregiver.
10. User sees confirmation that the request was sent.

## Important Meaning of the Request

The request represents an **initial opportunity/request for care**.

It does not mean:

- The caregiver has been hired.
- The caregiver has accepted employment.
- The caregiver has an active relationship with the Patient.
- The caregiver has joined the Care Circle.
- The caregiver has been assigned to the Patient.
- The caregiver has received Patient-care access.

Those steps occur later.

---

# 7. Information Included in the Initial Request

The Professional Caregiver must be able to understand the opportunity without receiving unrestricted Patient information.

The initial request includes the minimum information required to evaluate the opportunity, such as:

- Patient identifier/display name appropriate for the request
- General care requirements relevant to the opportunity
- Relevant care needs or requested care type
- Requesting party
- Circle context where applicable
- Request creation time
- Request status

The exact Patient health, safety, location, routine, and other private information remains protected until the appropriate authorization and relationship stages are completed.

## Privacy Rule

The request must not become a mechanism for bypassing Circle or Patient authorization.

---

# 8. Caregiver Receives Initial Request

## Actor

- Professional Caregiver

## Goal

Review the opportunity and express interest or availability.

## Flow

1. Caregiver receives a notification.
2. Caregiver opens the request.
3. System displays the information included in the initial request.
4. Caregiver reviews the opportunity.
5. Caregiver can:
   - Express interest / availability
   - Decline the request

## Caregiver Acceptance Meaning

**Caregiver acceptance is an expression of interest or availability only.**

It does **not** mean:

- Final hiring
- Final selection
- Active caregiver relationship
- Patient assignment
- Care Circle membership
- Patient-care access

This distinction must be explicit in both backend state and UI.

---

# 9. Caregiver Expresses Interest / Availability

## Actor

- Professional Caregiver

## Goal

Indicate willingness to proceed with the opportunity.

## Flow

1. Caregiver opens a pending request.
2. Caregiver selects **I'm Interested** / equivalent action.
3. System verifies that the request is still valid.
4. System changes the request state to indicate caregiver interest.
5. System notifies the requesting Patient/Family Member.
6. The request proceeds to the family-side decision stage.

## State Change

```text
Pending
   ↓
Caregiver Interested
```

## Rules

Caregiver interest does not create an active relationship.

The Family/authorized decision-maker must still confirm that the caregiver should proceed.

---

# 10. Family-Side Caregiver Confirmation

## Actor

- Family Member with authority to manage the Patient/caregiver relationship

## Goal

Make the final V1 decision to proceed with the caregiver.

## Flow

1. Family Member receives notification that the caregiver expressed interest.
2. Family Member reviews the caregiver profile and request.
3. System displays the caregiver's current status.
4. Family Member selects **Confirm Caregiver**.
5. Before confirmation, the system displays a prominent confirmation notice.

### Confirmation UI

The confirmation should clearly communicate the consequences:

> **Link this caregiver to [Patient Name]?**  
> Confirming will begin the process of linking this caregiver to the Patient. The caregiver must join the Patient's Care Circle before Patient-care access and assignment can be completed.

The user must explicitly confirm.

## Rules

This confirmation represents the **family-side decision to proceed**.

It still does not silently bypass the Care Circle.

The caregiver must subsequently join the appropriate Care Circle and complete the required relationship/assignment steps.

---

# 11. Care Circle Joining Requirement

## Actor

- Professional Caregiver

## Goal

Join the appropriate Care Circle after the family decides to proceed.

## Flow

1. Family confirmation creates the next-stage caregiver relationship request.
2. System provides the caregiver with the required Circle invitation/join mechanism.
3. Caregiver authenticates using their own Professional Caregiver account.
4. Caregiver reviews the Circle invitation.
5. Caregiver joins the Care Circle through the standard Care Circle workflow.
6. System confirms Circle membership.
7. Caregiver relationship processing can continue.

## Rules

- The caregiver must use their own Professional Caregiver account.
- Caregiver membership must be represented by the normal Care Circle membership system.
- The caregiver cannot gain Patient access merely because a Family Member confirmed them.
- Care Circle membership and caregiver relationship remain separate states.
- Circle membership alone does not grant Patient-care access.

---

# 12. Caregiver Assignment

Caregiver assignment occurs only after the required caregiver relationship and Circle conditions are satisfied.

The detailed assignment lifecycle belongs to:

`06-CAREGIVER-RELATIONSHIP.md`

The discovery workflow must not create an assignment as a side effect of caregiver acceptance.

---

# 13. Reject Initial Request

## Actor

- Professional Caregiver

## Goal

Decline the opportunity.

## Flow

1. Caregiver opens the pending request.
2. Caregiver selects **Decline**.
3. System confirms the action.
4. System changes the request to rejected.
5. Requesting user is notified.

## Rules

- A rejected request does not create a caregiver relationship.
- No Circle membership is created.
- No Patient access is created.
- A new request is required to restart the process.

---

# 14. Cancel Initial Request

## Actor

- Requesting Patient
- Requesting Family Member

## Goal

Withdraw the request before the process has reached an irreversible stage.

## Preconditions

- Request is still in a cancellable state.

## Flow

1. Requester opens the request.
2. Requester selects **Cancel Request**.
3. System confirms the action.
4. System changes the request to cancelled.
5. Caregiver is notified when appropriate.

## Rules

- A cancelled request cannot later be accepted.
- Cancelling an initial request does not affect an existing caregiver relationship.

---

# 15. Request Expiration

## V1 Rule

V1 does **not currently define a response deadline for caregiver requests**.

Therefore, the workflow must not invent an expiration period.

Until a V1 response deadline is explicitly defined, a pending request remains pending until one of the defined state transitions occurs:

```text
Pending
 ├── Caregiver Interested
 ├── Rejected
 └── Cancelled
```

If a future V1 decision introduces a response deadline, an explicit:

```text
Pending → Expired
```

transition can be added with a defined duration and notification behavior.

---

# 16. Prevent Duplicate Requests

For the same:

- Circle
- Patient
- Professional Caregiver

there may be only one active caregiver opportunity at a time.

If an active request already exists, the system does not create another one.

The user is shown the existing request and its current state.

A new request may be created only after the previous request has reached a state that permits a new request.

---

# 17. Post Care Requirements and Caregiver Applications

## Actor

- Family Member holding `Search/Request Caregivers`
- Professional Caregiver

## Goal

Allow authorized Family Members to publish non-identifying care requirements and allow Professional Caregivers to browse, filter, and apply for opportunities.

## Posting Authority

- A Family Member may post a care requirement only if they hold the canonical `Search/Request Caregivers` permission for the target Patient within an active Care Circle.
- Circle membership alone does not grant authority to post care requirements.

## Information Disclosure Rules

### Permitted Disclosed Information

To enable caregivers to evaluate fit, a published care requirement may disclose:

- General care context (e.g., companion care, meal preparation, mobility support)
- Requested caregiver skills, specializations, or experience level
- Desired schedule (e.g., weekday mornings, 4 hours/day, weekend coverage)
- General service area (city or general neighborhood)
- Non-identifying care notes
- Compensation / rate range if the family chooses to supply it

### Strictly Prohibited Disclosures Before Authorization

A published care requirement must **never** expose before formal relationship authorization:

- Exact Patient address or live location
- Full Patient profile or date of birth
- Medication names, dosages, or schedules
- Private daily routines or instructions
- Family contact information (phone, personal email)
- Emergency contacts or sensitive clinical diagnoses
- Private Care Circle membership details

## Caregiver Browsing and Application Flow

1. Professional Caregiver opens Opportunity Directory.
2. System displays active published care requirements matching the caregiver's service area and preferences.
3. Caregiver can browse and filter opportunities by care type, schedule, and general area.
4. Caregiver selects an opportunity and reviews the non-identifying details.
5. Caregiver submits an application, providing an **Application Note** explaining their relevant experience, approach, and fit, and referencing their professional profile.
6. System creates the application in the `Pending` state.
7. System prevents duplicate active applications: a caregiver cannot submit a second active application for the same requirement while an existing application is `Pending`.
8. The posting Family Member receives a notification of the incoming application.
9. Caregiver may **withdraw** their application at any time while it remains `Pending`.
10. The authorized Family Member reviews the application, Application Note, and caregiver discovery profile:
    - **Accept:** Marks the application `Accepted`.
    - **Reject:** Marks the application `Rejected`.
11. **Selection Only:** Acceptance of an application expresses mutual interest and selection only. **It does NOT create an active caregiver relationship, does NOT add the caregiver to the Care Circle, does NOT assign the Patient, and grants ZERO Patient data access.**
12. Once accepted, subsequent progress is authoritative in `06-CAREGIVER-RELATIONSHIP.md` (Family Confirmation → Care Circle Invitation and Joining → Formal Relationship Establishment → Patient Assignment).

## Application Lifecycle

```text
Pending
   ├── Accepted ──→ Follows Caregiver Relationship Workflow (06)
   ├── Rejected
   └── Withdrawn
```

## Opportunity Management and Closure

- An authorized Family Member may edit the requirements or close the posting at any time.
- Closing an opportunity marks pending applications as closed/rejected and notifies applicants.
- **Undefined V1 Product Decision:** V1 Product Requirements do not define an automatic expiration period for published care requirements. In accordance with audit standards, this workflow does not invent an expiration duration; care opportunities remain open until filled, closed, or cancelled by the authorized Family Member.

---

# 18. Patient and Assisted Setup Rules

## Self-Registered Patient

A Patient who completed their own registration may initiate a direct caregiver request for themselves. The request is associated with that Patient.

## Patient Receiving Assisted Setup

A Patient whose account was created or completed through assisted onboarding remains:

- The Patient
- The account owner
- The subject of the care request

Assisted setup does not make the helper the Patient or transfer ownership.

A Family Member may search, request caregivers, or post care requirements on behalf of an Assisted Patient only if that Family Member holds the canonical `Search/Request Caregivers` permission for that Patient within the active Care Circle.

The distinction between Patient participation and Family administration remains governed by the Patient Care and Care Circle workflows.

---

# 19. Privacy and Access Boundary

### Discovery and Postings allow

- Creating and editing a Professional Caregiver profile
- Searching and filtering discoverable caregivers
- Viewing approved self-reported professional information
- Initiating a direct caregiver request
- Publishing non-identifying care requirements
- Caregivers browsing opportunities and submitting applications with Application Notes
- Withdrawing pending applications
- Reviewing caregiver interest

### Discovery and Postings do not allow

- Final hiring by itself
- Creating an active caregiver relationship
- Automatically adding the caregiver to a Care Circle
- Assigning the caregiver to a Patient
- Giving unrestricted Patient access
- Viewing protected Patient location
- Viewing protected Patient safety information
- Viewing protected Patient routines or medications
- Exposing family contact details
- Viewing unrelated Circle information

---

# 20. Failure / Edge Cases

### Incomplete required profile fields

Caregiver cannot enable discoverability; clear validation errors identify missing required fields.

### Caregiver becomes unavailable

If the caregiver account becomes unavailable or disables discoverability while a request/application is pending:
- The request/application cannot proceed.
- No caregiver relationship is created.
- The requester/applicant is notified.

### Requester loses authority

If a Family Member loses `Search/Request Caregivers` permission before the request progresses:
- The request cannot progress through that Family Member.
- The request is invalidated/cancelled according to the relationship workflow.
- No unauthorized caregiver relationship is created.

### Opportunity closed while applications are pending

Pending applications transition to closed/rejected; applicants are notified.

### Caregiver withdraws application

Application transitions to `Withdrawn`. The family is notified that the applicant is no longer available.

### Patient leaves or is removed from Circle

Affected pending caregiver requests and posted care requirements for that Patient are invalidated as part of the Patient/Circle lifecycle.

### Circle is deleted

Affected caregiver requests and care requirements are invalidated.

### Caregiver already has an active relationship

The system must not create a duplicate relationship. The existing relationship state is shown instead.

### Caregiver expresses interest or application is accepted but Family does not proceed

No active relationship is created. The caregiver remains outside the Patient's care relationship until the formal Circle joining and relationship workflows are completed.

### Network failure

If request creation, posting, or application submission cannot be confirmed by the server:
- Do not show the item as successfully submitted.
- Do not create duplicates on retry.
- Allow the user to retry safely.

---

# 21. State Models

### Direct Caregiver Request State Model

```text
Pending
   │
   ├── Caregiver Interested
   │       │
   │       └── Family Confirmation
   │               │
   │               └── Caregiver Circle Joining
   │                       │
   │                       └── Caregiver Relationship Workflow (06)
   │
   ├── Rejected
   │
   └── Cancelled
```

### Care Requirement Application State Model

```text
Pending
   ├── Accepted ──→ Family Confirmation & Circle Joining (06)
   ├── Rejected
   └── Withdrawn
```

Important:

**`Caregiver Interested` / `Application Accepted` ≠ `Active Relationship`**

**`Family Confirmation` ≠ `Active Relationship`**

**`Circle Membership` ≠ `Active Relationship`**

**`Caregiver Assignment` is a separate authorized step.**

---

# 22. Acceptance Criteria

- Caregiver profile captures all defined fields (name, role, bio, experience, dementia experience, qualifications, skills, languages, availability, service area, capacity, rates, discoverability).
- Caregiver profile is undiscoverable by default.
- Enabling discoverability requires all 7 required fields (name, role, bio, general experience, languages, service area, availability).
- Qualifications and training are strictly self-reported; no Verified label or formal verification is introduced in V1.
- Caregiver can edit their own profile and discoverability setting at any time.
- Profile creation or discoverability does not grant Patient data access or establish relationships.
- Patient can request a caregiver for themselves according to Patient access rules.
- Family Member can request a caregiver or post a care requirement only if they hold `Search/Request Caregivers` for the target Patient.
- Circle membership alone does not grant discovery or posting authority.
- Published care requirements expose only non-identifying care details and strictly prohibit exact location, medications, private routines, family contacts, and full profiles.
- Caregivers can browse and filter opportunities and apply with an Application Note.
- Application lifecycle follows `Pending → Accepted / Rejected / Withdrawn`.
- Caregiver may withdraw a pending application.
- Duplicate active requests and applications are prevented.
- Application acceptance expresses selection/interest only and does not grant Circle membership, Patient assignment, or care access.
- Relationship establishment proceeds only through `06-CAREGIVER-RELATIONSHIP.md`.
- V1 does not invent an automatic expiration deadline for requests or care postings; absence of an automatic expiration rule is explicitly acknowledged.
- All request, posting, and application state changes are auditable.

---

# Boundary

`05-CAREGIVER-DISCOVERY.md` answers:

> **“How does a Patient or Family find a caregiver, and how does the caregiver express interest?”**

It ends before final caregiver relationship establishment.

The next workflow, `06-CAREGIVER-RELATIONSHIP.md`, answers:

> **“After both sides want to proceed, how does the caregiver formally become connected to the Patient, join the Circle, receive the correct permissions, become assigned, provide care, and eventually end that relationship?”**