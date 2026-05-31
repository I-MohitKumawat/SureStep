# Routine Redesign — Remaining Work

All database schema enums/tables, router endpoints, service methods, and controllers have been fully implemented in both the frontend and backend repositories.

---

## 5. UI/UX: Detailed Routine Guidance Screen

The mobile application transition replaces the checklist items with a rich detailed card:

1. **Header Area**: Display category icon, title, completion status (pending/overdue/done), and priority chip (e.g. Red for Critical, Yellow for High).
2. **Instructions Section**: Render markdown guidelines containing formatted text, bullet lists, or bold warnings.
3. **Visual reference attachment**: Render thumbnails of the uploaded medicine bottle or posture guidance. Clicking expands to a fullscreen preview.
4. **Resource links**:
   * **Documents**: Click to download/view clinical care PDFs.
   * **Video Tutorials**: In-app video player or Youtube link for exercises.
   * **Audio Guides**: Caregiver's recorded audio voice note instructions.
5. **Caregiver Notes (Hidden from Patient)**: Section visible only to caregivers containing clinical parameters (e.g., *"Make sure patient sits upright for 30 minutes after taking"*).
6. **Action Hub**: Big check button to mark completion, flag "Unsure", or request audio guidance.
