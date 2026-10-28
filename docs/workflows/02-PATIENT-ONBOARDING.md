# SureStep — Patient Onboarding Workflows

## Purpose

Define how a Patient account is initialized and how the patient's initial care profile is collected.

Patient onboarding has two modes:

- **Self onboarding** — the Patient completes onboarding themselves.
- **Assisted onboarding** — another person helps the Patient complete onboarding.

Assisted onboarding does not transfer ownership of the Patient account and does not automatically grant the assisting person ongoing access.

---

# 1. Start Patient Onboarding

## Actor

Patient.

## Goal

Initialize a new Patient account with the information required for SureStep to provide an appropriate basic care experience.

## Preconditions

- Patient has successfully authenticated.
- Patient selected the Patient role during account creation.
- Patient has not completed Patient onboarding.

## Flow

1. Patient enters the Patient onboarding flow.
2. System explains the purpose of onboarding.
3. Patient selects or confirms their preferred language.
4. Patient provides the requested information.
5. System validates each field.
6. Patient reviews the information.
7. Patient confirms the information.
8. System creates the initial Patient care profile.
9. System marks onboarding as completed.
10. Patient is taken to the Patient home interface.

---

# 2. Required and Optional Information

The onboarding flow explicitly distinguishes between information required to complete onboarding and information that can be added later.

## Required

The following are required before Patient onboarding can be completed:

- Name
- Date of birth
- Gender
- Preferred language
- Location
- Living arrangement
- Dementia severity
- Assistance required with daily activities
- Wandering risk / safety risk status
- Emergency contact name
- Emergency contact contact details
- Emergency contact relationship

## Optional

The following can be skipped during onboarding and completed later:

- Profile photo
- Household context
- Communication preferences
- Other health conditions
- Current medication information
- Additional safety concerns
- Optional emergency-contact account linking

## Rules

- Required information must be present before onboarding can be completed.
- Optional information must never block onboarding completion.
- A required field may still have a valid "unknown/not provided" value where the nature of the information makes that appropriate; this is different from simply leaving the field unfinished.
- The system must not silently convert an optional field into a required field.
- Required/optional classification applies to onboarding completion, not necessarily to later profile completeness.

## Acceptance Criteria

- The onboarding UI clearly identifies required and optional information.
- A Patient cannot complete onboarding while a required field is genuinely incomplete.
- A Patient can complete onboarding without providing optional information.
- Optional information remains available for later completion.

---

# 3. Assisted Patient Onboarding

## Actor

Patient and assisting person.

## Goal

Allow another person to help a Patient complete onboarding when the Patient cannot comfortably complete the process alone.

## Preconditions

- Patient account exists.
- Patient has authenticated.
- Patient has not completed onboarding.
- Another person is helping the Patient.

## Flow

1. Patient starts Patient onboarding.
2. Patient chooses to receive assistance, or another person assists the Patient with the Patient's participation.
3. The Patient or helper enters the requested information.
4. System records the information against the Patient account.
5. Patient and helper review the information together when possible.
6. Patient confirms the information when the Patient is able to do so.
7. If the Patient cannot provide confirmation, the helper can complete the confirmation.
8. System records that onboarding was completed with assistance.
9. Patient onboarding is completed.

## Rules

- The account remains a Patient account.
- The assisting person does not become the owner of the Patient account.
- Assisted onboarding does not automatically create a Family Member account.
- Assisted onboarding does not automatically grant the helper ongoing patient-data access.
- The Patient remains the authoritative person for their own information when they are able to communicate a choice.
- If the Patient and helper disagree about an entry and the Patient is able to communicate a clear choice, the Patient's choice is used.
- If the Patient cannot communicate a choice, the helper may provide the information.
- Information entered by a helper can be corrected later through the Patient profile workflow.
- The system records that onboarding was assisted.

## Acceptance Criteria

- A helper can complete onboarding with a Patient.
- The Patient account remains unchanged in ownership and role.
- The helper does not automatically receive ongoing access.
- Patient preferences take precedence when the Patient can communicate them.
- Assisted onboarding is distinguishable from self-completed onboarding.
- The resulting information belongs to the Patient account.

---

# 4. Collect Patient Personal Information

## Actor

Patient or assisting person.

## Goal

Provide the patient's basic identity information.

## Information

- Name — **Required**
- Date of birth — **Required**
- Gender — **Required**
- Profile photo — **Optional**
- Location — **Required**

## Rules

- Information is associated with the Patient account.
- Profile photo can be added later.
- Location information does not automatically grant another user access to the Patient's location.
- Location access is controlled separately through authorization and safety workflows.

## Acceptance Criteria

- Required personal information is present before onboarding completion.
- Optional photo can be skipped.
- Location remains protected by authorization rules.

---

# 5. Collect Communication Preferences

## Actor

Patient or assisting person.

## Goal

Configure the Patient's language and communication experience.

## Information

- Preferred language — **Required**
- Communication preferences — **Optional**

## Rules

- Preferred language must be selected before onboarding completion.
- Communication preferences can be configured later.
- Communication preferences do not determine Circle alert recipients.

## Acceptance Criteria

- Preferred language is stored.
- Communication preferences can be skipped.
- Alert authorization is not inferred from communication preferences.

---

# 6. Collect Living and Care Context

## Actor

Patient or assisting person.

## Goal

Record the Patient's current living and assistance situation.

## Information

- Living arrangement — **Required**
- Household context — **Optional**
- Assistance required with daily activities — **Required**

## Rules

- This information describes the Patient's current situation.
- It does not automatically create routines.
- It does not automatically grant caregiver access.

## Acceptance Criteria

- Required living/care information can be recorded.
- Optional household information can be skipped.
- Information remains editable after onboarding.

---

# 7. Collect Health and Dementia Context

## Actor

Patient or assisting person.

## Goal

Capture initial health and care information relevant to supporting the Patient.

## Information

- Dementia severity — **Required**
- Other health conditions — **Optional**
- Current medication information — **Optional**
- Wandering risk / safety risk status — **Required**
- Other safety concerns — **Optional**

## Rules

- Medication information does not block onboarding if it is unavailable.
- Health information is protected Patient information.
- Health information does not automatically grant another user access.
- Wandering risk and safety information may be used by later safety workflows.
- Recording a wandering risk does not automatically create a Safe Zone.

## Acceptance Criteria

- Dementia severity can be recorded.
- Wandering/safety risk status can be recorded.
- Other health conditions can be added later.
- Medication information can be added later.
- Unauthorized users cannot access the information.

---

# 8. Collect Emergency Contact

## Actor

Patient or assisting person.

## Goal

Record a person who can be contacted during an emergency.

## Information

- Emergency contact name — **Required**
- Contact details — **Required**
- Relationship to Patient — **Required**
- Account linking — **Optional**

## Rules

- Emergency contact information belongs to the Patient profile.
- Adding an emergency contact does not automatically make that person a Care Circle member.
- Optional account linking is separate from simply recording contact details.
- Emergency-contact status and Care Circle membership are separate concepts.

## Acceptance Criteria

- A valid emergency contact is recorded before onboarding completion.
- Contact relationship is stored.
- Adding the contact does not silently grant access to Patient information.

---

# 9. Review and Confirm Patient Information

## Actor

Patient or assisting person.

## Goal

Review and confirm the information collected during onboarding.

## Flow

1. System displays all onboarding information.
2. User reviews each section.
3. User can return to any section and edit its information.
4. Required fields are checked.
5. Patient confirms the information when able.
6. If the Patient cannot confirm, the assisting person can confirm on the Patient's behalf.
7. System records whether confirmation was:
   - Patient confirmed
   - Assisted confirmation
8. System saves the final onboarding state.

## Rules

- The Patient's confirmation takes precedence when the Patient is able to provide it.
- A helper cannot override a clear Patient choice.
- If the Patient cannot provide confirmation, assisted confirmation is permitted.
- Confirmation does not prevent later profile editing.
- Onboarding cannot be completed while a required field is genuinely incomplete.

## Acceptance Criteria

- Every onboarding section can be reviewed.
- Incorrect information can be corrected before completion.
- Patient confirmation is distinguished from assisted confirmation.
- Required information is validated before completion.
- Final information is saved only after successful confirmation.

---

# 10. Complete Patient Onboarding

## Actor

Patient or assisting person.

## Goal

Finish onboarding and enter the Patient experience.

## Preconditions

- All required information has been completed.
- Final information has been reviewed.
- Patient or authorized helper has completed confirmation.

## Flow

1. System validates all required information.
2. System saves the final onboarding state.
3. System records the confirmation mode.
4. System marks Patient onboarding as completed.
5. System initializes the Patient home experience.
6. Patient enters the Patient home interface.

## Rules

- Onboarding completion is atomic.
- The Patient must not be marked as fully onboarded if required information has not been successfully saved.
- Optional information may remain incomplete.
- Completing onboarding does not automatically:
  - Create a Care Circle.
  - Add Circle members.
  - Add caregivers.
  - Create Safe Zones.
  - Create routines.
  - Grant another person Patient-data access.

## Acceptance Criteria

- Required information is successfully saved.
- Patient onboarding status changes to completed.
- Confirmation mode is recorded.
- Patient reaches the Patient home interface.
- No unauthorized user receives access as a side effect.

---

# 11. Resume Incomplete Onboarding

## Actor

Patient or assisting person.

## Goal

Continue onboarding after leaving before completion.

## Preconditions

- Patient account exists.
- Patient onboarding is incomplete.
- At least one onboarding section has been saved.

## Flow

1. User authenticates again.
2. System detects incomplete onboarding.
3. System identifies the last successfully saved onboarding section and the first incomplete required section.
4. System returns the user directly to that incomplete section.
5. Previously saved information is restored.
6. User completes or edits the section.
7. User continues through any remaining incomplete sections.
8. User reaches the review and confirmation step.
9. Onboarding is completed.

## Rules

- The system tracks onboarding progress by section.
- Successfully saved sections are not unnecessarily cleared.
- Unsaved information from an interrupted session is not treated as saved.
- The user can navigate back to previously completed sections and edit them.
- If all required sections are complete but final confirmation has not happened, the user returns to the review/confirmation step.
- The Patient is not considered fully onboarded until final confirmation succeeds.

## Failure Cases

### Network failure while saving

- Previously saved information remains available.
- The failed save is not treated as successful.
- User can retry.

### App/browser closes during onboarding

- Previously saved information remains.
- Unsaved information is not assumed to have been saved.
- On next authentication, the user resumes from the appropriate incomplete section.

### Session expires

- Unsaved information is not treated as confirmed.
- User must authenticate again.
- Previously saved information remains available.

## Acceptance Criteria

- Incomplete onboarding can be resumed.
- The user is returned to the appropriate incomplete section rather than restarting from the beginning.
- Previously saved information is restored.
- Unsaved information is not falsely presented as saved.
- Required sections must still be completed before onboarding can finish.

---

# 12. Onboarding Data Lifecycle

The following information remains editable after onboarding through the appropriate Patient profile workflow.

### Personal

- Name
- Date of birth
- Gender
- Profile photo
- Location

### Communication

- Preferred language
- Communication preferences

### Living and care

- Living arrangement
- Household context
- Daily activity assistance requirements

### Health and safety

- Dementia severity
- Other health conditions
- Medication information
- Wandering risk
- Safety concerns

### Emergency

- Emergency contact
- Contact details
- Relationship
- Account linking

## Rules

- Editing information does not create a new Patient account.
- Changes remain associated with the same Patient identity.
- Changes to protected information respect authorization.
- Changes that affect active care workflows follow the relevant workflow rules.

---

# 13. Onboarding Identity Rules

- One Patient account represents one Patient identity.
- The Patient's phone number is the authentication identifier.
- Assisted onboarding does not create a second Patient account.
- A helper does not become a Family Member merely by assisting with onboarding.
- Patient onboarding and Care Circle membership are separate processes.
- Patient onboarding and caregiver assignment are separate processes.
- Patient onboarding and Safe Zone creation are separate processes.
- Patient onboarding and routine creation are separate processes.
- Completing onboarding never grants another user Patient-data access automatically.