# SureStep — Application Screen Catalog & Visual Flow Reference

This directory contains high-fidelity, data-populated screenshots captured from the live Android build of **SureStep**, an end-to-end dementia care assistance and monitoring platform.

All screenshots were captured on an Android emulator (**Google Pixel 7**, API 34) running the native application runtime with realistic clinical and personalized dementia-care test datasets (vitals, routines, safe zones, reminiscence albums, care circle escalations, and MMSE assessment tracking).

---

## Screen Directory Structure

```text
docs/screenshots/
├── 01_auth_onboarding/     (7 screens: Authentication & Role Selection)
├── 02_patient/             (20 screens: Dementia Patient Experience)
├── 03_family/              (14 screens: Family Guardian & Safe Perimeter Portal)
└── 04_caregiver/           (15 screens: Professional Caregiver & Clinical Hub)
```

---

## 1. Authentication & Onboarding Flow (`01_auth_onboarding`)

| # | Filename | Screen / Feature | Description |
|---|---|---|---|
| 01 | `01_welcome.png` | Welcome & Brand Splash | Introduction to SureStep with dementia-friendly typography, branding, and quick start CTA |
| 02 | `02_phone_auth.png` | Phone Number OTP Login | Secure phone number login with OTP verification for accessible sign-in |
| 03 | `03_role_selection.png` | User Role Selector | Three distinct role paths: **Patient**, **Family Member / Guardian**, and **Professional Caregiver** |
| 04 | `04_profile_setup.png` | Personal Profile Setup | Name, emergency contacts, profile photo, and language preferences |
| 05 | `05_patient_onboarding.png` | Patient Guided Onboarding | Simplified high-contrast onboarding for patients, setting up voice guidance and familiar contacts |
| 06 | `06_family_onboarding.png` | Family Guardian Setup | Setup of patient connection, care circle creation, and emergency notification contacts |
| 07 | `07_caregiver_onboarding.png` | Caregiver Verification | Professional credentials, caregiver certification, agency association, and hourly availability |

---

## 2. Patient Experience (`02_patient`)

Designed specifically for individuals with mild cognitive impairment (MCI) or early-stage dementia, featuring high-contrast UI, simplified typography, clear icons, and warm reminiscence prompts.

| # | Filename | Screen / Feature | Description |
|---|---|---|---|
| 01 | `01_patient_home_dashboard.png` | Patient Home Dashboard | Time of day greeting, upcoming medications, easy one-touch emergency button, and today's schedule |
| 02 | `02_patient_activities_hub.png` | Cognitive & Physical Activities | Curated exercises: Chair March, Mindfulness, Memory Games, and Calming Audio |
| 03 | `03_patient_workout_chair_march.png` | Guided Chair March Workout | Step-by-step low-impact physical exercise with animated timer and voice encouragement |
| 04 | `04_patient_relaxing_gratitude.png` | Mindfulness & Nature Sounds | Sensory relaxation session featuring soothing nature soundscapes and breathing guides |
| 05 | `05_patient_cognitive_games.png` | Cognitive Memory Games | Pattern matching, object recall, and orientation exercises tailored to maintain cognitive agility |
| 06 | `06_patient_stories_audio.png` | Reminiscence Stories Audio | Bedtime stories and calming audio narratives designed to reduce sundowning anxiety |
| 07 | `07_patient_activity_reports.png` | Activity & Cognitive Trends | Weekly cognitive engagement metrics, completed routines, and mood tracking trends |
| 08 | `08_patient_family_screen.png` | Family & Loved Ones Quick Connect | Large avatar tiles with instant call/video buttons for family members and trusted circle |
| 09 | `09_patient_memories_album.png` | Photo Reminiscence Album | Curated digital scrapbook with family milestones, pet photos, and familiar places |
| 10 | `10_patient_memory_viewer.png` | Memory Detail & Story Viewer | High-resolution memory viewer displaying date, location, contextual relationship notes, and audio notes |
| 11 | `11_patient_care_hub.png` | Care Support & Rapid SOS | Central hub for contacting caregivers, requesting urgent assistance, and accessing emergency services |
| 12 | `12_patient_care_team.png` | Assigned Care Team | List of verified nurses and caregivers assigned to the patient's care circle |
| 13 | `13_patient_care_discovery.png` | Caregiver Discovery Marketplace | Search and filter verified dementia care specialists by proximity, rating, and specializations |
| 14 | `14_patient_caregiver_profile.png` | Caregiver Profile & Credentials | Detailed bio, verified clinical certifications, patient reviews, and hourly rates |
| 15 | `15_patient_care_request.png` | Book Shift / Care Request | Booking interface for companion care, medication supervision, or overnight support |
| 16 | `16_patient_post_care_need.png` | Post Custom Care Need | Form to publish specific dementia support requirements to the caregiver community |
| 17 | `17_patient_care_responses.png` | Caregiver Offers & Responses | Review incoming proposals from qualified caregivers with response management |
| 18 | `18_patient_ai_companion.png` | SureStep AI Companion | Compassionate voice & text AI assistant providing gentle reminders and familiar trivia |
| 19 | `19_patient_personal_details.png` | Patient Medical & Emergency Profile | Blood group, allergies, primary physician contacts, and emergency medical directive notes |
| 20 | `20_patient_settings.png` | Accessibility & Display Settings | High contrast toggle, font scaling, audio cue settings, and night mode |

---

## 3. Family Guardian Portal (`03_family`)

Designed for family members and primary caregivers to monitor patient safety, manage geofences, track routine compliance, and coordinate care.

| # | Filename | Screen / Feature | Description |
|---|---|---|---|
| 01 | `01_family_home_dashboard.png` | Family Overview Dashboard | Live patient status card, current safe zone status, battery level, and recent alerts |
| 02 | `02_family_patient_overview.png` | Detailed Vitals & Health Summary | Heart rate, step count, sleep duration, medication adherence, and cognitive score overview |
| 03 | `03_family_safety_tracking.png` | Real-Time GPS Tracking & Map | Interactive map with live GPS breadcrumbs, speed, battery, and current zone perimeter |
| 04 | `04_family_safe_zones_list.png` | Configured Safe Zones | List of active geofences (Home Sanctuary, Day Club, Pharmacy) with soft/hard boundary types |
| 05 | `05_family_safe_zone_editor.png` | Geofence Radius Editor | Map editor with draggable pin, preset place chips, and radius adjustment stepper |
| 06 | `06_family_routines_list.png` | Daily Routines & Medications | Chronological checklist of morning, afternoon, and evening medication schedules and reminders |
| 07 | `07_family_routine_editor.png` | Routine & Medication Editor | Form to configure medication dosage, audio instructions, schedule days, and alert escalation |
| 08 | `08_family_people_circle.png` | Care Circle Members | Directory of family members, primary doctor, and verified caregivers in the patient's circle |
| 09 | `09_family_manage_circle.png` | Care Circle Management | Administrative controls for circle admins to add/remove members and transfer ownership |
| 10 | `10_family_invite_member.png` | Invite Member via Code | 6-character secure invite code generation with QR sharing and role assignment |
| 11 | `11_family_circle_permissions.png` | Granular Permissions Editor | Access control toggles: View Location, Edit Safe Zones, Medication Logging, SOS Escalation |
| 12 | `12_family_alerts_feed.png` | Dementia Incident & Alert Log | Historical feed of geofence exits, missed medications, fall detections, and low battery alerts |
| 13 | `13_family_alert_detail.png` | Incident Detail & Resolution | Incident timestamp, GPS map coordinates at time of event, severity badge, and resolution action |
| 14 | `14_family_settings.png` | Family Portal Settings | Notification push channels, SMS escalation tree, linked devices, and account settings |

---

## 4. Professional Caregiver Hub (`04_caregiver`)

Designed for professional dementia care workers, nurses, and home aides managing clinical shifts, medication handovers, assessments, and rapid triage.

| # | Filename | Screen / Feature | Description |
|---|---|---|---|
| 01 | `01_caregiver_dashboard_feed.png` | Caregiver Shift Dashboard | Active shift badge, incoming patient call bells, priority alerts, and today's schedule |
| 02 | `02_caregiver_patient_detail.png` | Patient Clinical Care Plan | Comprehensive patient profile: stage of dementia, allergy flags, medical history, and care instructions |
| 03 | `03_caregiver_patient_map.png` | Patient Location & Perimeter | Caregiver view of assigned patient location with distance, walking directions, and safe boundary |
| 04 | `04_caregiver_routine_checklist.png` | Medication & Task Checklist | Digital sign-off list for administering Donepezil, hydration checks, mobility assistance, and meals |
| 05 | `05_caregiver_patient_shifts.png` | Shift Schedule & Shift History | Upcoming and past care shifts, hours worked, supervisor notes, and patient assignment history |
| 06 | `06_caregiver_shift_handover.png` | Clinical Shift Handover | Structured shift handover report: vitals recorded, behavioral notes, sundowning severity, and supplies |
| 07 | `07_caregiver_assessment_form.png` | Cognitive & Mood Assessment Form | Digital Mini-Mental State Exam (MMSE) and mood evaluation form with scored clinical questions |
| 08 | `08_caregiver_assessment_view.png` | Assessment Trends & MMSE Graph | Historical cognitive score trends, historical progression graphs, and clinical doctor notes |
| 09 | `09_caregiver_triage.png` | Emergency Triage & Escalation | High-urgency triage protocol: Fall with injury, wandering, acute agitation, and 911 dispatch integration |
| 10 | `10_caregiver_circle_coordination.png` | Care Circle Team Hub | Direct coordination channel between assigned caregivers and family guardians |
| 11 | `11_caregiver_messages.png` | Secure Shift Messaging | HIPAA/GDPR-compliant messaging thread with family guardians for daily check-ins and photo updates |
| 12 | `12_caregiver_calendar.png` | Caregiver Availability Calendar | Monthly/weekly availability schedule, shift swapping, and confirmed booking dates |
| 13 | `13_caregiver_wellbeing.png` | Caregiver Wellbeing & Burnout | Respite care resources, mental wellness self-check, burnout prevention tips, and peer support |
| 14 | `14_caregiver_profile_edit.png` | Professional Profile & Rates | Edit hourly rate, years of experience, specialized dementia certifications, and background check info |
| 15 | `15_caregiver_settings.png` | Caregiver Settings & Alert Rules | Shift alert volumes, emergency ringthrough override, biometric login, and language settings |

---

## Technical Information

- **Emulator**: Google Pixel 7 (API Level 34, Android 14)
- **Display Resolution**: 1080 x 2400 (420 dpi)
- **Capture Technique**: Native `adb exec-out screencap -p` synchronized with React Native catalog event lifecycle
- **Date Generated**: November 5, 2026
