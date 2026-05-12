-- ─── caregiver_alerts ─────────────────────────────────────────────────────────
-- Stores non-routine safety alerts: fall detection, geofence breach, battery critical,
-- medical emergency. Routine alerts (missed tasks) are derived from the tasks table.
CREATE TABLE IF NOT EXISTS public.caregiver_alerts (
    id              TEXT PRIMARY KEY,
    patient_id      TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN (
                        'fall_detected', 'geofence_breach',
                        'battery_critical', 'medical_emergency'
                    )),
    severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.caregiver_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_caregiver_alerts" ON public.caregiver_alerts FOR ALL USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.caregiver_alerts;

-- ─── caregiver_alert_seen ─────────────────────────────────────────────────────
-- Tracks per-caregiver seen state for non-routine alerts.
-- A row here means caregiverPhone has viewed that alert at least once.
CREATE TABLE IF NOT EXISTS public.caregiver_alert_seen (
    alert_id        TEXT NOT NULL,
    caregiver_phone TEXT NOT NULL,
    seen_at         TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    PRIMARY KEY (alert_id, caregiver_phone)
);
ALTER TABLE public.caregiver_alert_seen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_alert_seen" ON public.caregiver_alert_seen FOR ALL USING (true);
