import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export interface LeafletZone {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  radius: number; // in meters
  boundaryType?: 'soft' | 'hard';
  color?: string;
}

export interface LeafletMember {
  id: string;
  name: string;
  role: 'PATIENT' | 'CAREGIVER' | 'FAMILY';
  coords: { latitude: number; longitude: number };
  status?: string;
  subLabel?: string;
}

export interface LeafletMapViewProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  zones?: LeafletZone[];
  members?: LeafletMember[];
  isBreach?: boolean;
  interactive?: boolean;
  draggablePin?: boolean;
  onLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  style?: any;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  center,
  zoom = 15,
  zones = [],
  members = [],
  isBreach = false,
  interactive = true,
  draggablePin = false,
  onLocationChange,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  const zonesJson = JSON.stringify(zones);
  const membersJson = JSON.stringify(members);
  const centerJson = JSON.stringify(center);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #E8ECE9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .custom-avatar-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .marker-bubble {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2.5px solid #FFFFFF;
      position: relative;
    }
    .marker-label {
      background: rgba(25, 30, 28, 0.88);
      color: #FFFFFF;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10.5px;
      font-weight: 600;
      margin-top: 3px;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
    }
    .patient-bubble {
      background: ${isBreach ? '#DC2626' : '#0E7A67'};
      animation: ${isBreach ? 'pulse-red 1.2s infinite' : 'pulse-green 2s infinite'};
    }
    .caregiver-bubble {
      background: #7C3AED;
    }
    .family-bubble {
      background: #2563EB;
    }
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(14, 122, 103, 0.7); }
      70% { box-shadow: 0 0 0 14px rgba(14, 122, 103, 0); }
      100% { box-shadow: 0 0 0 0 rgba(14, 122, 103, 0); }
    }
    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8); }
      70% { box-shadow: 0 0 0 18px rgba(220, 38, 38, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      opacity: 0.6;
    }
    .zone-label-tag {
      background: white;
      border: 1.5px solid #0E7A67;
      border-radius: 10px;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 700;
      color: #0E7A67;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const center = ${centerJson};
    const zones = ${zonesJson};
    const members = ${membersJson};
    const isBreach = ${isBreach ? 'true' : 'false'};
    const interactive = ${interactive ? 'true' : 'false'};
    const draggablePin = ${draggablePin ? 'true' : 'false'};

    const map = L.map('map', {
      center: [center.latitude, center.longitude],
      zoom: ${zoom},
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Draw Geofence Zones
    zones.forEach(function(z) {
      const isHard = z.boundaryType === 'hard';
      const color = z.color || (isHard ? '#C93B2B' : '#0E7A67');
      const circle = L.circle([z.center.latitude, z.center.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.16,
        weight: 2.5,
        dashArray: isHard ? '6, 6' : null,
        radius: z.radius
      }).addTo(map);

      // Label at north edge of circle
      const latOffset = (z.radius / 111300) * 0.95;
      const labelIcon = L.divIcon({
        className: 'zone-label-wrap',
        html: '<div class="zone-label-tag" style="border-color:' + color + '; color:' + color + ';">🛡️ ' + z.name + ' (' + z.radius + 'm)</div>',
        iconAnchor: [50, 10]
      });
      L.marker([z.center.latitude + latOffset, z.center.longitude], { icon: labelIcon, interactive: false }).addTo(map);
    });

    // Draw Members (Patient, Caregiver, Family Members)
    members.forEach(function(m) {
      let bubbleClass = 'family-bubble';
      let iconSymbol = 'F';
      if (m.role === 'PATIENT') {
        bubbleClass = 'patient-bubble';
        iconSymbol = isBreach ? '⚠️' : 'P';
      } else if (m.role === 'CAREGIVER') {
        bubbleClass = 'caregiver-bubble';
        iconSymbol = '🩺';
      } else {
        iconSymbol = '❤️';
      }

      const initials = m.name.split(' ').map(function(s){ return s[0]; }).slice(0, 2).join('');
      const displayLabel = m.name + (m.subLabel ? ' (' + m.subLabel + ')' : '');

      const customIcon = L.divIcon({
        className: 'custom-avatar-marker',
        html: '<div class="marker-bubble ' + bubbleClass + '">' + (iconSymbol.length === 1 ? initials : iconSymbol) + '</div>' +
              '<div class="marker-label">' + displayLabel + '</div>',
        iconSize: [60, 56],
        iconAnchor: [30, 28]
      });

      const marker = L.marker([m.coords.latitude, m.coords.longitude], {
        icon: customIcon
      }).addTo(map);

      marker.bindPopup('<b>' + m.name + '</b><br>' + (m.status || m.role) + '<br>Coords: ' + m.coords.latitude.toFixed(4) + ', ' + m.coords.longitude.toFixed(4));
    });

    // Draggable Pin for Safe Zone Editor
    if (draggablePin) {
      const pinIcon = L.divIcon({
        className: 'custom-avatar-marker',
        html: '<div class="marker-bubble patient-bubble" style="background:#0E7A67;">📍</div><div class="marker-label">Safe Zone Center</div>',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });
      const pinMarker = L.marker([center.latitude, center.longitude], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);

      pinMarker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'LOCATION_CHANGED',
            latitude: pos.lat,
            longitude: pos.lng
          }));
        }
      });

      map.on('click', function(e) {
        pinMarker.setLatLng(e.latlng);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'LOCATION_CHANGED',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }));
        }
      });
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color="#0E7A67" />
          </View>
        )}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOCATION_CHANGED' && onLocationChange) {
              onLocationChange({ latitude: data.latitude, longitude: data.longitude });
            }
          } catch (e) {
            // ignore
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E8ECE9',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8ECE9',
  },
});
export default LeafletMapView;
