# Workflow: Memories and Activities

## Purpose

Define how Patients access familiar memories and voluntary activities.

This workflow covers:

- Patient Activities
- Family-photo matching
- Simple visual activities
- Breathing guidance
- Memories
- Photos
- Short videos
- Text memories
- Viewing fresh and previous memories
- How these features interact with the Patient's routine and My People experience

Memories are a familiarity/reassurance feature, not a social network.

---

# 1. Patient Activities

### Actor

Patient.

### Goal

Participate in a simple voluntary activity for engagement, familiarity, or relaxation.

### Preconditions

- Patient account exists.
- Activity is available to the Patient.

### Flow

1. Patient opens Activities or encounters an activity through today's routine.
2. System displays the activity using a simple, low-decision interface.
3. Patient participates.
4. Patient reaches the activity's completion/end state or leaves the activity.
5. System records the activity outcome where required by the activity.

### V1 Activities

Initial V1 activities include:

- Family-photo matching game.
- Simple visual matching games.
- Shape matching.
- Animal matching.
- Breathing guide.

The family-photo matching activity allows the Patient to:

1. View a set of family-member photos.
2. Flip/reveal cards where applicable.
3. Match a family member's photo with their name.
4. Complete the activity.

### Rules

- Activities are voluntary.
- Activities remain voluntary even when included inside a routine.
- An activity is not equivalent to an essential-care task.
- Failure to complete an activity must not be treated as missed medication, missed essential care, or a safety event.
- Activities must not require the Patient to understand Care Circle administration.
- Patient-facing activities should minimize decisions and unnecessary complexity.

---

# 2. Activities Added to a Routine

### Actor

Patient or user with authority to manage the relevant routine.

### Goal

Surface a voluntary activity as part of the Patient's daily routine.

### Flow

1. An activity is included in a routine.
2. The activity appears at the configured point in the Patient's routine.
3. Patient may start the activity.
4. Patient may complete the activity.
5. Patient may leave/skip the optional activity.
6. Failure to complete it does not create an essential-care failure.

### Rules

- Adding an activity to a routine does not change its voluntary nature.
- Activity completion does not become a required care-compliance event merely because it appears in a routine.
- Activity behavior must remain distinct from required care-task behavior defined in `04-PATIENT-CARE.md`.

---

# 3. Activity Completion

### Actor

Patient.

### Flow

1. Patient completes the activity.
2. System records completion where activity history is supported.
3. The activity is no longer presented as an unfinished optional activity for that occurrence.

### Rules

- V1 does not require sophisticated cognitive scoring.
- V1 does not require cognitive assessment based on activity performance.
- Activity performance must not be presented as a medical diagnosis or clinical assessment.
- The system must not infer dementia progression from activity performance.

### Out of Scope

V1 does not require:

- clinical cognitive scoring;
- cognitive assessment backend;
- diagnostic scoring;
- comparative patient rankings;
- competitive leaderboards;
- social activity feeds.

---

# 4. Breathing Guide

### Actor

Patient.

### Goal

Follow a simple guided breathing activity.

### Flow

1. Patient opens the breathing guide.
2. System presents simple visual/instructional guidance.
3. Patient follows the displayed breathing sequence.
4. Patient can finish or leave the activity.

### Rules

- The breathing guide is an activity, not a medical treatment.
- It does not create a medical assessment.
- It does not generate a safety alert merely because the Patient leaves or does not complete it.

---

# 5. Memories

### Purpose

Memories provide familiar content that can help the Patient recognize and feel connected to people in their care.

### Supported Content

V1 memories may contain:

- Photos.
- Short videos.
- Text.

### Memory Management Permission

Memory creation, editing, and deletion are controlled by the `Manage Patient Memories` permission.

- The Circle Owner holds `Manage Patient Memories` by default.
- The Owner can delegate `Manage Patient Memories` to eligible Circle members through the standard permission-management workflow in `03-CARE-CIRCLE.md`.
- A delegated holder can create, edit, and delete memory content for the Patient within their authorized scope.
- Revoking `Manage Patient Memories` prevents subsequent memory-management operations for that member. It does not remove already-shared memories from the Patient's view.
- `Manage Patient Memories` is separate from `Manage Member Permissions`. Holding one does not confer the other.
- Memory-management permission does not grant additional Circle-administration, caregiver-management, or Patient-data permissions (health, location, routines, safety information).

### Default Memory Visibility

As an explicit V1 product decision, memory content associated with a Patient is visible by default to all people currently connected to that Patient through:

- Active Care Circle membership, or
- Active caregiver assignment.

Visibility follows current membership and assignment state. When a member is removed or an assignment ends, memory access is reevaluated against current authorization.

> **Gap — non-Circle connected people:** The requirements and workflows do not establish a relationship type for people connected to the Patient who are not Circle members and not assigned caregivers (for example, an emergency contact with an account link but no Circle invitation). If such a category is introduced in V1, its memory-visibility rules must be explicitly defined before implementation. Do not infer or inherit visibility automatically.

### Flow

1. An authorized person (holder of `Manage Patient Memories`) opens the memory management area for a Patient.
2. System verifies the actor's `Manage Patient Memories` permission.
3. Actor selects supported content:
   - photo;
   - short video;
   - text.
4. System validates the content and confirms the actor's authorization.
5. System associates the memory with the Patient.
6. Memory becomes visible to the default permitted audience (Circle members and assigned caregivers currently connected to that Patient).
7. The Patient can view the memory through the applicable familiar-content experience.

### Rules

- Only holders of `Manage Patient Memories` may create, edit, or delete memory content.
- Viewing a person's profile does not itself grant memory-management authority.
- Circle membership alone does not grant memory-management authority unless `Manage Patient Memories` has been explicitly granted.
- A caregiver relationship and assignment grant memory *visibility* (as part of the default audience) but do not grant memory-management authority.
- Sharing a memory does not establish a Care Circle membership or caregiver relationship.
- Sharing a memory does not grant access to Patient health, location, routine, or safety information.
- Memories remain a familiarity/reassurance feature, not a social network.

---

# 6. Patient Viewing Memories

### Actor

Patient.

### Goal

View familiar content associated with people connected to their care.

### Flow

1. Patient opens My People or the familiar-content experience.
2. Patient selects a connected person where applicable.
3. System displays available memories associated with that person.
4. Patient can:
   - view photos;
   - play short videos;
   - read associated text.
5. Patient can browse previous memories.

### Rules

- Patient can view both fresh and previous memories.
- Memory presentation should prioritize recognition and familiarity rather than social interaction.
- The Patient should not need to understand the underlying Care Circle structure.
- Content must only be shown when the Patient has access to it.

---

# 7. Memory Content Types

## Photo

The Patient can open and view the photo.

## Short Video

The Patient can play the video through the Patient-facing memory experience.

## Text

The Patient can read the associated text.

### Rules

- Content must remain within the supported V1 types.
- V1 does not require a general-purpose social-media post system.
- V1 does not require public sharing, follower systems, reactions, comments, or social engagement metrics.

---

# 8. Memories Through My People

### Actor

Patient.

### Goal

Use familiar people as an entry point to memories.

### Flow

1. Patient opens My People.
2. Patient sees connected people.
3. A member card may show:
   - name;
   - photo;
   - quick call/contact action.
4. Patient opens a member profile.
5. Profile may show:
   - name;
   - photo;
   - short introduction;
   - appropriate contact information;
   - appropriate general location;
   - memories associated with that person.
6. Patient selects a memory to view.

### Rules

My People is a simplified Patient-facing representation of people connected to their care.

The Patient does not need to understand:

- Circle ownership;
- member permissions;
- caregiver-management permissions;
- internal membership mechanics.

Those concepts remain in the Care Circle and caregiver workflows.

### My People Population Rules

My People is populated strictly according to the following rules:

1. **Connected Family Members:** Active Family Members belonging to the Patient's active Care Circle who have a valid connection to the Patient.
2. **Professional Caregivers:** Professional Caregivers appear in My People **only** after both an active caregiver relationship (or active notice period) and an explicit Patient assignment exist (`06-CAREGIVER-RELATIONSHIP.md`). Caregivers who have merely joined the Circle or submitted an application never appear in My People.
3. **Explicitly Connected Trusted People:** Trusted people explicitly linked to the Patient through authorized care configuration.
4. **Active Connection Ending:** When a person's relevant connection ends (e.g., Circle membership removal, caregiver relationship termination, or assignment revocation), they are immediately removed from the active My People view.
5. **Historical Retention:** Historical memories and records associated with that person are preserved where required by existing data lifecycle rules; however, the person no longer appears as an active contact in My People.
6. **No Derivative Permissions:** Appearing in or viewing My People grants **zero** additional permissions. It does NOT grant memory CRUD (`Manage Patient Memories`), health data access, location access, routine management, or safety alert permissions.
7. **Identified Product Gap (Non-Circle Connected People):** V1 product requirements mention displaying "trusted people explicitly connected to the Patient" and emergency contacts. However, existing V1 workflows only define accounts for Circle Members and assigned Professional Caregivers. If a trusted person (such as an emergency contact) does not hold a Care Circle account, V1 lacks a standalone relationship model to populate them with a live profile or memories in My People. This remains an identified V1 boundary gap rather than an invented relationship structure.

---

# 9. Memory Access and Relationship Changes

Memory visibility follows the Patient's current authorized access to the relevant connected person/content.

Changes to Care Circle membership or caregiver relationships must not be interpreted as automatically creating new memory permissions unless the applicable access rule explicitly grants them.

When a person's relationship/access to the Patient changes, affected memory access must be reevaluated using the same authorization rules used for the underlying content.

No workflow in this document creates a new caregiver relationship or Care Circle membership.

---

# 10. Content Availability Failure

### Memory unavailable

If a previously available memory can no longer be retrieved:

- the system must not display fabricated content;
- the Patient receives a clear indication that the content is unavailable;
- other available memories remain accessible.

### Video unavailable

If a video cannot be loaded:

- the system must not represent it as playable;
- the Patient receives an appropriate unavailable/loading state.

### Network failure

If the Patient loses network connectivity:

- content already available locally may remain viewable where supported;
- unavailable content must not be represented as successfully loaded.

---

# 11. Patient Experience Boundary

The Patient-facing experience should remain simple and familiarity-oriented.

The system should prioritize:

1. Familiar people.
2. Familiar photos/videos.
3. Simple activities.
4. Clear actions.
5. Minimal decisions.

The Patient should not be exposed to unnecessary:

- social-network concepts;
- administrative concepts;
- permission-management interfaces;
- Care Circle management;
- caregiver-management workflows.

---

# 12. Audit and History

Where the underlying operation is auditable, the system records relevant memory/activity actions according to the applicable audit requirements.

At minimum, the system must not represent activity participation as clinical assessment data.

Memory history should preserve the distinction between current/fresh content and previously shared memories.

---

# Acceptance Criteria

1. Patient can access available V1 activities.
2. V1 includes the family-photo matching activity.
3. V1 supports simple visual matching activities.
4. V1 includes a breathing guide.
5. Activities are voluntary.
6. An activity included in a routine remains voluntary.
7. Failure to complete an optional activity does not behave like missed essential care.
8. V1 does not require sophisticated cognitive assessment or scoring.
9. Activity performance is not presented as a dementia diagnosis or clinical assessment.
10. Connected people can share photos, short videos, and text memories according to the applicable access rules.
11. Patient can view fresh memories.
12. Patient can browse previous memories.
13. Memories can be associated with a connected person.
14. My People can expose memories associated with a person's profile.
15. Memories are presented as a familiarity/reassurance feature rather than a social-media system.
16. Memory sharing does not itself establish a Care Circle membership or caregiver relationship.
17. Memory sharing does not itself grant access to Patient health, location, routine, or safety information.
18. Unavailable memory content is never represented as successfully loaded.
19. Memory and activity experiences do not expose unnecessary Care Circle administration to the Patient.
20. Only holders of `Manage Patient Memories` may create, edit, or delete memory content for a Patient.
21. The Circle Owner holds `Manage Patient Memories` by default and can delegate it through the standard permission-management mechanism.
22. Revoking `Manage Patient Memories` prevents subsequent memory-management operations without removing already-shared memories from the Patient's view.
23. Memory management permission does not grant health, location, routine, safety, or Circle-administration access.
24. Memory content is visible by default to active Circle members and assigned caregivers connected to that Patient.
25. Changes to a user's relationship/access are reevaluated against the applicable memory-access rules.
26. No activity or memory workflow automatically creates or transfers care relationships.
27. My People displays active Family Members with a valid Patient connection, trusted people explicitly connected, and Professional Caregivers only once an active relationship and Patient assignment exist.
28. Individuals are removed from the active My People view immediately when their relevant care connection or relationship ends.
29. My People presence does not grant memory CRUD, health-data access, location access, routine management, or safety permissions.

## Longitudinal Activity Data

### Purpose

SureStep records basic activity, game, and routine-performance data as longitudinal application history.

The purpose in V1 is to preserve useful historical information and support care/activity features.

V1 does not interpret this data as a clinical measurement or prediction.

### Data recorded

For routine occurrences, where applicable:
- Scheduled occurrence
- Start time
- Completion time
- Completion status
- Overdue status
- Actor who recorded completion
- Historical occurrence records

For activities:
- Activity type
- Attempt
- Completion
- Completion timestamp
- Time taken
- Basic result/performance information where available

For games:
- Game type
- Attempt
- Score/result
- Time taken
- Completion history

### Flow

1. Patient starts an activity or game.
2. System creates an activity session/attempt record.
3. System records the basic interaction/result data produced by that activity.
4. Patient completes or exits the activity.
5. System records the final completion state and timestamp.
6. Historical activity data remains available as longitudinal activity history.
7. Authorized users may view permitted historical information according to patient-data permissions.

### Rules

- Participation is voluntary.
- Recording activity data does not make the activity a clinical assessment.
- A score is the result of that particular activity/game and must not be presented as a cognitive or dementia score.
- Changes in performance must not automatically be described as cognitive decline.
- The system must not generate a dementia prediction in V1.
- The system must not assign a dementia severity level from activity telemetry.
- The system must not make clinical recommendations from activity telemetry.
- Missing activity data must not be interpreted as deterioration.
- A patient choosing not to participate must not be treated as a negative clinical signal.
- Historical records must not be rewritten merely because a later interpretation or scoring algorithm changes.

### Permissions

Longitudinal activity data follows the authorization boundary of the underlying patient data.

Circle membership alone does not grant access.

A caregiver may access longitudinal information only when their existing patient assignment and permissions authorize the relevant patient information.

No new permission is created merely because telemetry exists.

### Notifications

V1 does not send notifications for every activity/game event.

Activity data may be stored without generating a notification.

Care/safety notifications continue to follow their respective workflows.

### Data interpretation boundary

V1 collects raw longitudinal data but does not perform clinical interpretation.

Future versions may investigate:
- Individual baseline establishment
- Changes in routine adherence
- Changes in activity participation
- Changes in game performance
- Changes in completion time
- Longitudinal trend detection
- Caregiver-facing trend summaries
- Research into whether these signals correlate with cognitive or functional decline

These are future capabilities and must not be implemented as V1 behavior.

### Future ML / research boundary

The V1 data model should preserve sufficient historical information for future research without requiring V1 to implement an ML model.

Future research may create a controlled research dataset derived from longitudinal activity data.

Research datasets should use appropriate privacy protections and should not expose unnecessary direct identifiers.

Any future model claiming to predict dementia, cognitive decline, or another clinical outcome requires separate validation and appropriate research/clinical governance before being presented as a clinical capability.

### Acceptance Criteria

- Repeated activity sessions create separate historical records.
- Routine completion history remains available across repeated occurrences.
- Game scores/results are retained when the game produces them.
- Time taken is retained when available.
- Historical records identify the relevant patient and activity/session.
- Unauthorized users cannot access another patient's longitudinal activity history.
- V1 never displays a dementia/cognitive/progression score derived from these records.
- V1 never presents raw activity telemetry as a diagnosis or clinical prediction.
- Missing participation is not automatically classified as deterioration.
- Activity telemetry can exist without generating a notification.
- Historical data remains available for future analysis without requiring V1 to implement that analysis.