# SureStep — Family Member Role Roadmap

> **Status:** Phase 1 (read-only dashboard) implemented. Phases 2–4 are roadmap items.

---

## The Problem

Dementia care involves a **triangle of people**, not a dyad:

```
    Patient
    /     \
Caregiver ──── Family
```

Currently SureStep only serves the first two. Family members — adult children, spouses, siblings — have no in-app view and must call the caregiver to get updates. This creates:
- Information bottleneck on the caregiver
- Anxiety for family ("Is Mum okay right now?")
- Delayed response when both caregiver and family need to act

---

## Role Design Decision

### Option A ✅ (Implemented) — Dedicated `family` Role

Family members register with role = `'family'`. They get a read-only `FamilyDashboardScreen` showing:
- Live patient safety status (large, glanceable)
- Mini-map of patient location
- Today's routine progress
- Alert history feed

**Pros:** Clean separation, correct permissions, extensible.
**Cons:** Family must register and be linked (small friction).

### Option B ❌ — Shared Caregiver Credentials

Family use the caregiver's login. **Rejected** — security risk, no audit trail, can't personalise notifications.

### Option C ❌ — Push-Only

Family receive push notifications but have no app screen. **Rejected** — too passive, no context, anxiety-inducing without visualisation.

---

## Phase 1 — Read-Only Dashboard (✅ Done)

**What's built:**
- `family` role added to `mock_users.role` constraint
- `family_links` table in Supabase
- `FamilyDashboardScreen` with:
  - Large safety status card (4 states: safe / approaching / breach / no signal)
  - Mini-map of patient location (tapable to full GeofenceMapScreen)
  - Routine progress bar + task list
  - Alert history feed (from `geofence_alerts`)
  - Supabase Realtime subscription for new alerts
- Route `FamilyDashboard` registered in `RootNavigator`

**How to link a family member:**
1. Caregiver or patient creates a `family_links` row in Supabase (no UI yet — Phase 2).
2. Family member registers in SureStep with role = `family`.
3. App routes them to `FamilyDashboard` with `patientPhone`.

---

## Phase 2 — Family Management UI (Planned)

**Goal:** Caregivers can invite family members from within the app.

**New screens:**
- `FamilyManageScreen` (caregiver tab) — list linked family, add/remove
- `FamilyInviteScreen` — enter family member's phone, select relationship, set permissions

**New Supabase tables:**
- `family_invites` — pending invites with short-lived token

**Flow:**
```
Caregiver → taps "Add Family Member"
         → enters phone number + relationship
         → Supabase inserts family_invites row
         → Family member receives SMS/push with deep-link
         → Opens app → registers → auto-linked
```

---

## Phase 3 — Push Notifications to Family (Planned)

**Goal:** Family are notified the instant a patient leaves their safe zone, without needing the app open.

**Requirements:**
- `expo-notifications` — `getExpoPushTokenAsync()` on login
- New `user_push_tokens` Supabase table
- Supabase Edge Function on `geofence_alerts INSERT`
- Expo Push Notification API (free, no server needed)

**Notification design:**

| Event | Title | Body |
|-------|-------|------|
| Patient exits zone | 🚨 Safety Alert | "Mum has left home. Last seen 150m away." |
| Patient returns | ✅ All Clear | "Mum has returned to the safe zone." |
| Zone battery < 20% | 🔋 Low Battery | "Patient phone is at 15%. Please charge." |
| Task missed | 📋 Missed Routine | "Mum hasn't completed her 08:00 medication." |

**Escalation logic (Phase 3b):**
- Breach alert sent to family
- If un-acknowledged after 5 minutes → send SMS to caregiver (via Supabase Edge + Twilio)
- If un-acknowledged after 10 minutes → trigger SOS call prompt in caregiver app

---

## Phase 4 — Two-Way Communication (Planned)

**Goal:** Family can communicate with the patient through the app without needing a phone call.

**Features:**
- Simple "Check In" button → sends a push to patient device with a friendly message ("Your family is thinking of you!")
- Patient responds with 1-tap: 😊 / 😐 / 😟 (mood check-in)
- Family see mood history on their dashboard

**Why this matters for dementia care:**
- Reduces isolation for the patient
- Gives family emotional data without intrusive calls
- Patient-facing UI is large, simple, emoji-based (accessible for cognitive impairment)

---

## Permissions Model

| Action | Patient | Caregiver | Family |
|--------|---------|-----------|--------|
| View own location | ✅ | ✅ | ✅ (if permitted) |
| View patient location | — | ✅ | ✅ (if `can_view_location`) |
| Edit safe zone | — | ✅ | ❌ |
| Add routines | — | ✅ | ❌ |
| Acknowledge alerts | — | ✅ | ❌ (Phase 3 consideration) |
| Invite family | — | ✅ | ❌ |
| Receive push alerts | — | ✅ | ✅ (if `notify_on_breach`) |
| Check-in to patient | — | ✅ | ✅ (Phase 4) |

---

## UI/UX Principles for Family-Facing Screens

1. **One answer, big.** The safety status card must be the first thing seen — full width, large emoji, high-contrast badge. No ambiguity.

2. **Colour is not the only signal.** Always pair colour with emoji AND text label (accessibility for colour-blind family members).

3. **Recency is trust.** Always show "Updated Xs ago". A stale location with no age indicator creates false confidence.

4. **No editing affordances.** Family screens must never show buttons that create anxiety (e.g. "Edit Zone", "Delete Task"). Read-only with clear visual separation from caregiver views.

5. **Calm defaults.** When status is "Safe", the card should feel warm and reassuring — not clinical. When breach, it must feel urgent without causing panic (avoid flashing/loud animations).

6. **Offline-aware.** When the app can't reach Supabase, show a clear "Last known location" indicator rather than a blank card.

---

## Technical Notes

- `family_links.can_view_location` = false disables map access for that family member
- `family_links.notify_on_breach` = false disables push for routine-only viewers
- Family dashboard uses the same `useTasks()` context as the patient screen — tasks are filtered by `patientId` (patient's phone number)
- Supabase Realtime channel `family_alerts_${patientPhone}` keeps the alert feed live without polling
