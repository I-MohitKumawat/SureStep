# SureStep — Geofencing Technical Design Specification

This document details the production-grade technical architecture for the geofencing and tracking engine in SureStep. It addresses the core trade-off between **high-frequency tracking (<30s)** and **system optimization (power, data, and server scalability)**, alongside details on spatiotemporal algorithms and offline resilience.

---

## 1. Client-Side Location Engine (On-Device Intelligence)

To support <30s tracking during movement without draining the battery or overload backend services, the device must manage tracking frequency autonomously.

### 1.1. Adaptive Power & Frequency Algorithm
To prevent **GPS drift flapping** (which indoors can range from 10m to 50m+), the client app does not transition to Active State on distance alone. It requires a multi-variable trigger:
*   **Active State Trigger**: `distance_delta > 50m` **AND** `speed > 1 m/s` **AND** `gps_accuracy < 50m` (Medium/High confidence).

The client app adjusts reporting intervals dynamically based on the current GPS speed:

| Speed Category | Speed Range (m/s) | Sync Interval | Rationale |
| :--- | :--- | :--- | :--- |
| **Stationary** | `< 0.5 m/s` | **5 minutes** | Patient is resting or indoors. Saves battery. |
| **Walking** | `0.5 to < 3.0 m/s` | **30 seconds** | Default walking speed range. |
| **Jogging/Running**| `3.0 to < 7.0 m/s` | **15 seconds** | Fast movement requires denser updates. |
| **Vehicle/Transit**| `>= 7.0 m/s` | **10 seconds** | High speed transit; covers distance rapidly. |

#### Emergency State Power Optimization
When an emergency breach or SOS is active, we optimize battery life by splitting tracking based on motion:
*   **Emergency + Moving** (speed >= 0.5 m/s): Sync every **10 seconds** for real-time interception.
*   **Emergency + Stationary** (speed < 0.5 m/s): Sync every **30 seconds**. If the patient sits down or stops, there is no need to drain battery transmitting duplicate coordinates.

### 1.2. GPS Confidence Scoring
Raw GPS accuracy parameters (in meters) are mapped directly to confidence levels:
*   `accuracy < 15m` $\rightarrow$ **High Confidence** (Clean satellite GPS fix).
*   `accuracy < 50m` $\rightarrow$ **Medium Confidence** (WiFi / cellular network triangulation).
*   `accuracy >= 50m` $\rightarrow$ **Low Confidence** (Drift-prone; degraded indoor environment).

**System Rule**: Alert generation and geofence evaluations are only executed for **High** and **Medium** confidence points. Low confidence pings are written to the database for tracking trails but are suppressed from triggering boundary breach alarms, eliminating false alerts.

### 1.3. Offline Resilience (Spatiotemporal Queueing)
*   **Local SQLite Storage**: When internet connectivity is lost, the app continues tracking location using the active state frequency. Coordinates are pushed into an on-device local database (using SQLite/WatermelonDB).
*   **Local Geofencing Evaluation**: Active geofence zones are cached locally on the device during login/onboarding. The app performs local Haversine calculations. If it detects a breach offline, it attempts to trigger a local push notification or SMS-based fallback alert if SMS permissions are configured.
*   **Batch Synchronization**: Upon detecting network reconnection (via NetInfo), the app doesn't send individual pings. It sends a compressed batch request (`POST /location/pings/sync`) containing the queued location data points. This allows the backend to retroactively populate the "last-seen journey" timeline.

---

## 2. Spatiotemporal Mathematics & Algorithms

### 2.1. Distance: Haversine vs. Vincenty
*   For geofence calculations (checking if coordinate $(lat_2, lng_2)$ is within $r$ meters of $(lat_1, lng_1)$), we use the **Haversine Formula**:
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
    Where $R = 6,371,000$ meters.
*   *Why*: Haversine is computationally cheap, highly accurate over short distances, and fast to run on mobile processors. Vincenty’s formula (which models the Earth as an ellipsoid) is too expensive for continuous 30s on-device checks.

### 2.2. Direction: Return Home Prediction (Sliding Window Heading)
To prevent direction indicators from flapping rapidly (e.g., oscillating between "toward" and "away" every few seconds due to small GPS drifts):
*   **Sliding Window Heading**: The system caches the last 5–10 coordinates and computes a **weighted average heading vector** ($V_{avg}$). More recent steps are assigned higher weight:
    $$V_{avg} = \sum_{i=1}^{k} w_i \cdot (P_i - P_{i-1})$$
    Where $w_i$ increases linearly with recency.
*   This averaged heading vector ($V_{avg}$) is compared against the Home Vector ($H$).
    *   If the dot product $V_{avg} \cdot H > 0.3$: Patient is reliably returning home.
    *   If the dot product $V_{avg} \cdot H < -0.3$: Patient is reliably wandering away.

### 2.3. Behavior: Loop Wandering Detection (Production Models)
Rather than simple centroid variance which triggers false positives when walking in small parks or waiting outside shops, production-grade tracking uses three indicators:
1.  **Path Self-Intersection Rate**: Detects how many times the patient's path crosses itself within a rolling window of 15 minutes. High intersections indicate aimless pacing.
2.  **Trajectory Similarity (Dynamic Time Warping)**: Compares consecutive segments of the trajectory (e.g., path segment from minutes 0-10 vs. minutes 10-20). A high similarity score (low DTW distance) indicates the patient is retracing the exact same loop.
3.  **Clustering & Heading Change Frequency**: Clusters coordinate points spatially (using rolling distance thresholds). If 90% of the points fall into 1 or 2 tight clusters, but the heading change frequency (turns exceeding 120 degrees) is high, it flags repetitive, disoriented pacing.

---

## 3. Database Storage & Spatial Queries

Ingesting coordinates every 30s for thousands of users creates a scale issue (millions of writes per day).

### 3.1. Spatial Indexing
### 3.1. Spatial Indexing
We use **PostgreSQL with PostGIS** extensions.
*   **Multi-geometry Support from Day One**: To prevent database schema migrations when moving from circles to custom boundaries, the `geofence_zones` table stores boundaries as a generic geometry type:
    *   `geom` column of type `GEOGRAPHY(Geometry, 4326)` (supporting `POINT`, `POLYGON`, and `MULTIPOLYGON`).
    *   For circular geofences, we store the center coordinate and a `radius_m` column (evaluating via `ST_DWithin`). For custom safe zones (neighborhoods/routes), we store a `POLYGON` or `MULTIPOLYGON` and evaluate via `ST_Contains` or `ST_Covers`.
*   Index geofences for rapid $O(\log N)$ spatial queries:
    ```sql
    CREATE INDEX idx_geofences_geom ON geofence_zones USING GIST(geom);
    ```

### 3.2. Storage Tiering & Partitioning
*   **Location Pings (Time-series Partitioning)**: The `location_pings` table is partitioned by date (e.g. daily partitions).
*   **Retention Policy**:
    *   *Raw Pings*: Stored for **7 days** to render the "last-seen journey" timeline. After 7 days, they are deleted or archived to cold storage.
    *   *State Changes / Alerts*: Stored permanently in history tables (`patient_states_history` and `geofence_alerts`).

---

## 4. Caregiver Proximity Search

During a geofence breach, finding the geographically closest caregiver is vital:
*   Caregivers' locations are stored in a temporary, high-speed cache (such as Redis Geospatial indexes, or a Postgres memory table using `UNLOGGED` tables).
*   When a breach alert fires, the system queries caregivers within a specific radius (e.g. 5km) sorted by distance using PostGIS:
    ```sql
    SELECT caregiver_id, ST_Distance(caregiver_loc, patient_loc) AS dist
    FROM caregiver_locations
    WHERE ST_DWithin(caregiver_loc, patient_loc, 5000)
    ORDER BY dist ASC
    LIMIT 1;
    ```
*   Redis implementation uses `GEORADIUS` or `GEOSEARCH`, which executes in sub-millisecond times, leaving PostgreSQL free from routing queries.
