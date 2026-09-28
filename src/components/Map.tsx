'use client';
import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAlertStore } from '@/store/useAlertStore';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Dummy initial viewport
const INITIAL_VIEW_STATE = {
  longitude: -122.41669,
  latitude: 37.7853,
  zoom: 13,
  pitch: 45,
  bearing: 0
};

export default function DashboardMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const { alerts, selectedEmergencyId, setAlerts, setSelectedEmergencyId } = useAlertStore();
  const [responderLoc, setResponderLoc] = useState<{lat: number, lng: number} | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    const alertsRef = ref(database, 'emergencies');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter only active SOS alerts
        const activeOnly = Object.entries(data).reduce((acc, [key, val]: [string, any]) => {
          if (val.status && val.status.toUpperCase() === 'SOS_ACTIVE') {
            acc[key] = val;
          }
          return acc;
        }, {} as Record<string, any>);
        setAlerts(activeOnly);
      } else {
        setAlerts({});
      }
    });

    return () => unsubscribe();
  }, [user?.role]);

  // Auto-select first alert if none selected
  useEffect(() => {
    const alertEntries = Object.entries(alerts);
    if (alertEntries.length > 0 && !selectedEmergencyId) {
      setSelectedEmergencyId(alertEntries[0][0]);
    } else if (alertEntries.length === 0) {
      setSelectedEmergencyId(null);
      setRouteData(null);
      setDistanceKm(null);
    }
  }, [alerts, selectedEmergencyId]);

  // Track responder's live location
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setResponderLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error("Geolocation error:", err);
          // Fallback location if permission denied or no secure context
          setResponderLoc({ lat: 5.02, lng: 7.95 });
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fetch driving route and distance
  useEffect(() => {
    if (responderLoc && selectedEmergencyId && alerts[selectedEmergencyId] && MAPBOX_TOKEN) {
      const target = alerts[selectedEmergencyId];
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${responderLoc.lng},${responderLoc.lat};${target.longitude},${target.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            setRouteData(data.routes[0].geometry);
            setDistanceKm(data.routes[0].distance / 1000);
          }
        } catch (e) {
          console.error('Error fetching route', e);
        }
      };
      fetchRoute();
    }
  }, [responderLoc, selectedEmergencyId, alerts]);

  // Center the map on the latest alert if available
  useEffect(() => {
    const alertValues = Object.values(alerts);
    if (alertValues.length > 0) {
      // Get the most recent one based on timestamp (if needed) or just the first one
      const latest = alertValues[alertValues.length - 1];
      if (latest.latitude && latest.longitude) {
        setViewState(prev => ({
          ...prev,
          longitude: latest.longitude,
          latitude: latest.latitude,
          zoom: 14,
        }));
      }
    }
  }, [alerts]);

  return (
    <div className="flex-1 w-full h-full bg-zinc-900 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {MAPBOX_TOKEN === undefined && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Mapbox Token Missing</h2>
          <p className="text-white/60 text-center max-w-md">
            Please add your Mapbox access token to NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to view the map.
          </p>
        </div>
      )}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Distance Info Overlay */}
        {distanceKm !== null && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl z-20">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Distance to Target</h3>
            <div className="text-white text-2xl font-bold flex items-end gap-1">
              {distanceKm.toFixed(2)} <span className="text-sm font-normal text-white/50 mb-1">km</span>
            </div>
          </div>
        )}

        {/* Route Line Layer */}
        {routeData && (
          <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeData }}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Responder Location Marker */}
        {responderLoc && (
          <Marker longitude={responderLoc.lng} latitude={responderLoc.lat} anchor="bottom">
            <div className="relative group cursor-pointer flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-500 border-2 border-white rounded-full shadow-lg relative z-10 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="mt-1 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xl">
                YOU
              </div>
            </div>
          </Marker>
        )}

        {Object.entries(alerts).map(([id, alert]) => (
          <Marker 
            key={id} 
            longitude={alert.longitude} 
            latitude={alert.latitude} 
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedEmergencyId(id);
            }}
          >
            <div className="relative group cursor-pointer flex flex-col items-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-red-500 rounded-full opacity-30 animate-ping"></div>
                <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg relative z-10 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="mt-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap z-20 flex flex-col items-center">
                <p className="text-white text-xs font-bold uppercase">{alert.type || 'EMERGENCY'}</p>
                {alert.timestamp && (
                  <p className="text-white/70 text-[10px]">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
                {(alert.ip || alert.ipAddress) && (
                  <p className="text-blue-400 text-[10px] font-mono mt-0.5">
                    IP: {alert.ip || alert.ipAddress}
                  </p>
                )}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
