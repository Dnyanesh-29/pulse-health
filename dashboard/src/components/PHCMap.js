import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { subscribeToStockUpdates } from '../firebase';

// Base PHC locations with coordinates
// These are real PHC locations from our dataset
export const PHC_MARKERS = [
  { name: "Sangamner Rural PHC", lat: 19.5786, lng: 74.2095,
    district: "Ahmednagar", state: "Maharashtra" },
  { name: "Akole Tribal PHC", lat: 19.6156, lng: 73.9845,
    district: "Ahmednagar", state: "Maharashtra" },
  { name: "Rahata Block PHC", lat: 19.7167, lng: 74.4833,
    district: "Nashik", state: "Maharashtra" },
  { name: "Kopargaon PHC", lat: 19.8833, lng: 74.4833,
    district: "Ahmednagar", state: "Maharashtra" },
  { name: "Shrirampur PHC", lat: 19.6167, lng: 74.6500,
    district: "Ahmednagar", state: "Maharashtra" },
  { name: "Nevasa PHC", lat: 19.5500, lng: 74.9833,
    district: "Ahmednagar", state: "Maharashtra" },
  { name: "Parner PHC", lat: 18.9833, lng: 74.4167,
    district: "Pune", state: "Maharashtra" },
  { name: "Nashik Central PHC", lat: 19.9975, lng: 73.7898,
    district: "Nashik", state: "Maharashtra" },
  { name: "Pune Rural PHC", lat: 18.5204, lng: 73.8567,
    district: "Pune", state: "Maharashtra" },
  { name: "Nagpur East PHC", lat: 21.1458, lng: 79.0882,
    district: "Nagpur", state: "Maharashtra" },
  { name: "Chandrapur PHC", lat: 19.9615, lng: 79.2961,
    district: "Chandrapur", state: "Maharashtra" },
  { name: "Gadchiroli PHC", lat: 20.1809, lng: 80.0000,
    district: "Gadchiroli", state: "Maharashtra" },
  { name: "Jaipur Central PHC", lat: 26.9124, lng: 75.7873,
    district: "Jaipur", state: "Rajasthan" },
  { name: "Ajmer Rural PHC", lat: 26.4499, lng: 74.6399,
    district: "Ajmer", state: "Rajasthan" },
  { name: "Jodhpur West PHC", lat: 26.2389, lng: 73.0243,
    district: "Jodhpur", state: "Rajasthan" },
  { name: "Udaipur Block PHC", lat: 24.5854, lng: 73.7125,
    district: "Udaipur", state: "Rajasthan" },
  { name: "Barmer PHC", lat: 25.7521, lng: 71.3967,
    district: "Barmer", state: "Rajasthan" },
  { name: "Bikaner PHC", lat: 28.0229, lng: 73.3119,
    district: "Bikaner", state: "Rajasthan" },
  { name: "Lucknow Central PHC", lat: 26.8467, lng: 80.9462,
    district: "Lucknow", state: "Uttar Pradesh" },
  { name: "Kanpur Rural PHC", lat: 26.4499, lng: 80.3319,
    district: "Kanpur", state: "Uttar Pradesh" },
  { name: "Chennai North PHC", lat: 13.0827, lng: 80.2707,
    district: "Chennai", state: "Tamil Nadu" },
  { name: "Coimbatore PHC", lat: 11.0168, lng: 76.9558,
    district: "Coimbatore", state: "Tamil Nadu" },
  { name: "Kolkata East PHC", lat: 22.5726, lng: 88.3639,
    district: "Kolkata", state: "West Bengal" },
  { name: "Murshidabad PHC", lat: 24.1800, lng: 88.2700,
    district: "Murshidabad", state: "West Bengal" },
  { name: "Bhopal Central PHC", lat: 23.2599, lng: 77.4126,
    district: "Bhopal", state: "Madhya Pradesh" },
  { name: "Indore Rural PHC", lat: 22.7196, lng: 75.8577,
    district: "Indore", state: "Madhya Pradesh" },
];

export const BASE_PHC_DATA = PHC_MARKERS;

// Default stock status based on our HMIS data
export const DEFAULT_STATUS = {
  "Ahmednagar": { medicine: "ORS", daysLeft: 6, status: "atrisk" },
  "Nashik": { medicine: "Paracetamol", daysLeft: 3, status: "critical" },
  "Pune": { medicine: "IFA", daysLeft: 21, status: "safe" },
  "Nagpur": { medicine: "ORS", daysLeft: 9, status: "atrisk" },
  "Chandrapur": { medicine: "Antibiotics", daysLeft: 4, status: "critical" },
  "Gadchiroli": { medicine: "ORS", daysLeft: 2, status: "critical" },
  "Jaipur": { medicine: "IFA", daysLeft: 4, status: "critical" },
  "Ajmer": { medicine: "ORS", daysLeft: 9, status: "atrisk" },
  "Jodhpur": { medicine: "Antibiotics", daysLeft: 19, status: "safe" },
  "Udaipur": { medicine: "Zinc", daysLeft: 2, status: "critical" },
  "Barmer": { medicine: "ORS", daysLeft: 5, status: "atrisk" },
  "Bikaner": { medicine: "IFA", daysLeft: 15, status: "safe" },
  "Lucknow": { medicine: "ORS", daysLeft: 3, status: "critical" },
  "Kanpur": { medicine: "IFA", daysLeft: 8, status: "atrisk" },
  "Chennai": { medicine: "Antibiotics", daysLeft: 2, status: "critical" },
  "Coimbatore": { medicine: "Zinc", daysLeft: 11, status: "atrisk" },
  "Kolkata": { medicine: "ORS", daysLeft: 19, status: "safe" },
  "Murshidabad": { medicine: "IFA", daysLeft: 5, status: "atrisk" },
  "Bhopal": { medicine: "Paracetamol", daysLeft: 1, status: "critical" },
  "Indore": { medicine: "ORS", daysLeft: 16, status: "safe" },
};

export const STATUS_COLORS = {
  critical: '#C0392B',
  atrisk: '#E67E22',
  safe: '#27AE60'
};

const mapContainerStyle = {
  height: '480px',
  width: '100%',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
};

const mapCenter = {
  lat: 22.5937,
  lng: 78.9629
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function PHCMap() {
  const [markers, setMarkers] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [selectedPhc, setSelectedPhc] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY || ''
  });

  // Subscribe to real Firestore stock_updates
  useEffect(() => {
    const unsub = subscribeToStockUpdates((updates) => {
      if (updates && updates.length > 0) {
        setLiveUpdates(updates);
        setLiveCount(updates.length);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Merge base data with real Firestore updates
  useEffect(() => {
    const merged = PHC_MARKERS.map(phc => {
      // Check if we have real data for this PHC
      const realUpdate = liveUpdates.find(u => 
        u.phc_id && u.phc_id.toLowerCase()
          .includes(phc.district.toLowerCase())
      );

      if (realUpdate) {
        // Use real data from Firestore
        const qty = realUpdate.quantity || 0;
        const status = qty < 100 ? 'critical' 
                     : qty < 500 ? 'atrisk' 
                     : 'safe';
        return {
          ...phc,
          medicine: realUpdate.medicine || 'Unknown',
          quantity: qty,
          daysLeft: Math.floor(qty / 50),
          status,
          isLive: true,
          reportedBy: realUpdate.sender_number,
          channel: realUpdate.channel,
          timestamp: realUpdate.timestamp
        };
      }

      // Use HMIS-based default data
      const defaults = DEFAULT_STATUS[phc.district] || {
        medicine: 'ORS',
        daysLeft: 15,
        status: 'safe'
      };
      return { ...phc, ...defaults, isLive: false };
    });

    setMarkers(merged);
  }, [liveUpdates]);

  const criticalCount = markers.filter(
    m => m.status === 'critical'
  ).length;
  
  const atRiskCount = markers.filter(
    m => m.status === 'atrisk'
  ).length;

  const getMarkerIcon = (status, isLive) => {
    const color = STATUS_COLORS[status] || '#27AE60';
    return {
      path: (window.google && window.google.maps && window.google.maps.SymbolPath)
        ? window.google.maps.SymbolPath.CIRCLE
        : 0,
      scale: isLive ? 9 : 7,
      fillColor: color,
      fillOpacity: 0.95,
      strokeColor: '#FFFFFF',
      strokeWeight: isLive ? 3 : 2,
    };
  };

  return (
    <div>
      {/* Live data indicator */}
      {liveCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '8px', marginBottom: '8px',
          fontSize: '12px', color: '#2D6A4F'
        }}>
          <span style={{
            width: '8px', height: '8px',
            borderRadius: '50%', background: '#27AE60',
            animation: 'pulse 1.5s infinite'
          }}/>
          {liveCount} live reports from Firestore
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', borderRadius: '12px', overflow: 'hidden' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={5}
            options={mapOptions}
            onClick={() => setSelectedPhc(null)}
          >
            {markers.map((phc, i) => (
              <MarkerF
                key={`phc-${phc.name}-${i}`}
                position={{ lat: phc.lat, lng: phc.lng }}
                title={`${phc.name} (${phc.medicine}: ${phc.daysLeft} days left)`}
                icon={getMarkerIcon(phc.status, phc.isLive)}
                onClick={() => setSelectedPhc(phc)}
              />
            ))}

            {selectedPhc && (
              <InfoWindowF
                position={{ lat: selectedPhc.lat, lng: selectedPhc.lng }}
                onCloseClick={() => setSelectedPhc(null)}
              >
                <div style={{ minWidth: '200px', padding: '4px', color: '#111827' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    {selectedPhc.name}
                    {selectedPhc.isLive && (
                      <span style={{
                        marginLeft: '6px',
                        background: '#E8F5E9',
                        color: '#2D6A4F',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: 'bold'
                      }}>● Live</span>
                    )}
                  </div>
                  <div style={{ 
                    color: '#666', 
                    fontSize: '12px',
                    marginBottom: '8px'
                  }}>
                    {selectedPhc.district}, {selectedPhc.state}
                  </div>
                  <hr style={{ margin: '6px 0', border: 'none',
                    borderTop: '1px solid #eee' }}/>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      Medicine: <strong>{selectedPhc.medicine}</strong>
                    </div>
                    {selectedPhc.quantity && (
                      <div style={{ marginBottom: '4px' }}>
                        Quantity: <strong>{selectedPhc.quantity} units</strong>
                      </div>
                    )}
                    <div style={{ marginBottom: '4px' }}>
                      Days left: <strong style={{
                        color: STATUS_COLORS[selectedPhc.status]
                      }}>
                        {selectedPhc.daysLeft} days
                      </strong>
                    </div>
                    <div>
                      Status: <strong style={{
                        color: STATUS_COLORS[selectedPhc.status],
                        textTransform: 'capitalize'
                      }}>
                        {selectedPhc.status === 'atrisk' ? 'At Risk' : selectedPhc.status}
                      </strong>
                    </div>
                    {selectedPhc.isLive && selectedPhc.channel && (
                      <div style={{ 
                        marginTop: '8px',
                        fontSize: '11px',
                        color: '#666'
                      }}>
                        Via {selectedPhc.channel.toUpperCase()} • {selectedPhc.reportedBy}
                      </div>
                    )}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : loadError ? (
          <div style={{
            ...mapContainerStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FEF2F2',
            color: '#B91C1C',
            fontSize: '14px',
            padding: '20px',
            textAlign: 'center'
          }}>
            Error loading Google Maps. Please check your API key.
          </div>
        ) : (
          <div style={{
            ...mapContainerStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F9FAFB',
            color: '#6B7280',
            fontSize: '14px'
          }}>
            Loading Google Maps...
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            <span style={{ color: '#C0392B' }}>●</span>
            {' '}Critical (&lt;5 days) — {criticalCount} PHCs
          </span>
          <span>
            <span style={{ color: '#E67E22' }}>●</span>
            {' '}At Risk (5-14 days) — {atRiskCount} PHCs
          </span>
          <span>
            <span style={{ color: '#27AE60' }}>●</span>
            {' '}Safe (&gt;14 days)
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#999' }}>
          Showing {markers.length} PHCs across 6 states
          {liveCount > 0 && ` • ${liveCount} live reports`}
        </div>
      </div>
    </div>
  );
}
