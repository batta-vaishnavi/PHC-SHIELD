import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

// Create custom colored Leaflet DivIcons
const createColorIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const greenIcon = createColorIcon('#10b981'); // Emerald
const amberIcon = createColorIcon('#f59e0b'); // Amber
const redIcon = createColorIcon('#ef4444');   // Red

export const MapView = ({ phcs = [], alerts = [], height = "480px" }) => {
  // Filter PHCs that have valid coordinates
  const validPhcs = phcs.filter(
    (p) => p.latitude !== null && p.longitude !== null && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  if (validPhcs.length === 0) {
    return (
      <div
        style={{ height }}
        className="bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-3">
          <MapPin className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No PHC location data available.</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Add Latitude and Longitude coordinates to Primary Health Centres to render live geospatial risk heatmaps.
        </p>
      </div>
    );
  }

  // Group alerts by PHC
  const alertsByPhc = {};
  alerts.forEach((a) => {
    alertsByPhc[a.phc_id] = alertsByPhc[a.phc_id] || [];
    alertsByPhc[a.phc_id].push(a);
  });

  // Calculate default map center
  const avgLat = validPhcs.reduce((acc, p) => acc + p.latitude, 0) / validPhcs.length;
  const avgLon = validPhcs.reduce((acc, p) => acc + p.longitude, 0) / validPhcs.length;

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={[avgLat, avgLon]}
        zoom={validPhcs.length === 1 ? 11 : 8}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validPhcs.map((phc) => {
          const phcAlerts = alertsByPhc[phc.id] || [];
          const hasHigh = phcAlerts.some((a) => a.risk_level === 'HIGH');
          const hasMed = phcAlerts.some((a) => a.risk_level === 'MEDIUM');
          
          const icon = hasHigh ? redIcon : (hasMed ? amberIcon : greenIcon);
          const highestRisk = hasHigh ? 'HIGH' : (hasMed ? 'MEDIUM' : 'LOW');

          return (
            <Marker key={phc.id} position={[phc.latitude, phc.longitude]} icon={icon}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{phc.id}</span>
                    <RiskBadge level={highestRisk} size="sm" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{phc.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{phc.district}, {phc.state}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                    {phcAlerts.length > 0 ? (
                      <div>
                        <span className="font-bold text-rose-700 block mb-1">
                          {phcAlerts.length} Active Shortage Alert(s):
                        </span>
                        <ul className="space-y-1">
                          {phcAlerts.slice(0, 3).map((a, i) => (
                            <li key={i} className="text-[11px] text-slate-700">
                              • <strong>{a.medicine_name}</strong>: {a.coverage_days !== null ? `${a.coverage_days}d stock` : 'Low Stock'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        <span>All monitored medicines healthy</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-md text-xs flex items-center gap-4">
        <span className="font-bold text-slate-700">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 font-medium">Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-600 font-medium">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span className="text-slate-600 font-medium">Critical</span>
        </div>
      </div>
    </div>
  );
};
