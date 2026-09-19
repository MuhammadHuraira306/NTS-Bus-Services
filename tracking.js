/**
 * NTS Travel Services - Live Bus Tracking & Map Simulation Engine
 *
 * FUTURE BACKEND:
 * Replace client-side simulation with WebSocket (Socket.io) or MQTT telemetry streams
 * receiving GPS coordinates directly from onboard IoT telematics units.
 * A real map API (Google Maps Platform, Mapbox, or Leaflet/OSM) can be initialized
 * inside the renderMap() container.
 */

import { storage } from './storage.js';
import { calculateDistanceKm, calculateEtaMinutes } from './utils.js';

let activeGpsWatchId = null;
let simulationInterval = null;

export class NTSTrackingManager {
  /**
   * Driver: Start broadcasting live GPS
   * Uses browser Geolocation API with realistic transit corridor fallback simulation
   */
  static startBroadcasting(busId, onUpdate) {
    const bus = storage.getBusById(busId);
    if (!bus) return false;

    // Mark GPS active in storage
    storage.updateBus(busId, { isGpsActive: true });

    // 1. Try real browser Geolocation API
    if ('geolocation' in navigator) {
      try {
        activeGpsWatchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed } = position.coords;
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // If tester is static, gently interpolate along route stops for realistic demo
            const updated = storage.updateBus(busId, {
              lat: latitude,
              lng: longitude,
              speed: speed ? `${Math.round(speed * 3.6)} km/h` : '38 km/h',
              lastUpdated: timeStr,
              isGpsActive: true
            });

            if (onUpdate && updated) onUpdate(updated);
          },
          (error) => {
            console.warn('Browser GPS unavailable or denied, activating transit simulation:', error.message);
            this._startCorridorSimulation(busId, onUpdate);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      } catch (err) {
        console.warn('Geolocation failed to initialize, using simulation:', err);
        this._startCorridorSimulation(busId, onUpdate);
      }
    } else {
      this._startCorridorSimulation(busId, onUpdate);
    }

    return true;
  }

  /**
   * Stop broadcasting
   */
  static stopBroadcasting(busId) {
    if (activeGpsWatchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(activeGpsWatchId);
      activeGpsWatchId = null;
    }
    if (simulationInterval !== null) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    storage.updateBus(busId, { isGpsActive: false });
  }

  /**
   * Autonomous corridor simulation for realistic demo without requiring driving
   */
  static _startCorridorSimulation(busId, onUpdate) {
    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
      const bus = storage.getBusById(busId);
      if (!bus || !bus.isGpsActive) {
        clearInterval(simulationInterval);
        return;
      }

      const route = storage.getRouteById(bus.routeId);
      if (!route) return;

      const stops = route.stopIds.map(id => storage.getStopById(id)).filter(Boolean);
      if (stops.length === 0) return;

      // Advance stop or progress between coordinates
      let currentIndex = bus.currentStopIndex || 0;
      const targetStop = stops[Math.min(currentIndex + 1, stops.length - 1)];

      // Slight GPS jitter towards next stop
      const dLat = (targetStop.lat - bus.lat) * 0.15;
      const dLng = (targetStop.lng - bus.lng) * 0.15;

      const newLat = bus.lat + dLat + (Math.random() - 0.5) * 0.0004;
      const newLng = bus.lng + dLng + (Math.random() - 0.5) * 0.0004;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const updated = storage.updateBus(busId, {
        lat: Number(newLat.toFixed(5)),
        lng: Number(newLng.toFixed(5)),
        speed: `${Math.floor(35 + Math.random() * 15)} km/h`,
        lastUpdated: timeStr
      });

      if (onUpdate && updated) onUpdate(updated);
    }, 4000);
  }

  /**
   * Calculate student ETA to their selected stop
   */
  static getBusArrivalStatus(bus, studentStop) {
    if (!bus || !studentStop) {
      return {
        statusText: "Bus status unavailable",
        etaMinutes: "--",
        distanceKm: "--",
        isApproaching: false,
        isAtStop: false
      };
    }

    const dist = calculateDistanceKm(bus.lat, bus.lng, studentStop.lat, studentStop.lng);
    const eta = calculateEtaMinutes(dist);

    const isAtStop = dist <= 0.3 || (bus.journeyStatus === 'At Stop' && bus.currentStopIndex !== undefined);
    const isApproaching = dist <= 2.5 && !isAtStop;

    let statusText = "Bus is on route";
    if (isAtStop) {
      statusText = `Bus has arrived at ${studentStop.name}!`;
    } else if (isApproaching) {
      statusText = `Bus is approaching ${studentStop.name} (~${eta} min)`;
    } else if (dist < 8) {
      statusText = `Bus is in transit toward your area (~${eta} min)`;
    } else {
      statusText = `Bus is scheduled (${dist} km away)`;
    }

    return {
      statusText,
      etaMinutes: eta,
      distanceKm: dist,
      isApproaching,
      isAtStop
    };
  }

  /**
   * Render visually convincing interactive route map in SVG
   * Structured so Google Maps, Mapbox, or Leaflet can easily replace this container
   */
  static renderRouteMap(containerEl, bus, targetStopId = null) {
    if (!containerEl) return;

    if (!bus) {
      containerEl.innerHTML = `
        <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
          <p>No active bus selected for live tracking.</p>
        </div>
      `;
      return;
    }

    const route = storage.getRouteById(bus.routeId);
    const stops = route ? route.stopIds.map(id => storage.getStopById(id)).filter(Boolean) : [];

    // Compute bounding box coordinates to scale SVG viewBox
    const lats = [bus.lat, ...stops.map(s => s.lat)];
    const lngs = [bus.lng, ...stops.map(s => s.lng)];

    const minLat = Math.min(...lats) - 0.015;
    const maxLat = Math.max(...lats) + 0.015;
    const minLng = Math.min(...lngs) - 0.015;
    const maxLng = Math.max(...lngs) + 0.015;

    // Convert GPS (lat, lng) to SVG (x, y) coordinates
    const width = 800;
    const height = 360;

    const toSvgCoord = (lat, lng) => {
      const x = ((lng - minLng) / (maxLng - minLng)) * (width - 120) + 60;
      // Invert Y because latitude increases northward
      const y = height - (((lat - minLat) / (maxLat - minLat)) * (height - 80) + 40);
      return { x, y };
    };

    // Build SVG Path for Route Highway
    const stopCoords = stops.map(s => toSvgCoord(s.lat, s.lng));
    let pathD = "";
    if (stopCoords.length > 0) {
      pathD = `M ${stopCoords[0].x} ${stopCoords[0].y}`;
      for (let i = 1; i < stopCoords.length; i++) {
        // Curve slightly for highway appearance
        const prev = stopCoords[i - 1];
        const curr = stopCoords[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        pathD += ` Q ${prev.x + 10} ${midY}, ${curr.x} ${curr.y}`;
      }
    }

    const busCoord = toSvgCoord(bus.lat, bus.lng);

    containerEl.innerHTML = `
      <svg class="map-svg-canvas" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B1F3A" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#1557A6" stop-opacity="0.9" />
          </linearGradient>
          <filter id="busGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0B1F3A" flood-opacity="0.35"/>
          </filter>
        </defs>

        <!-- Background grid details -->
        <rect x="0" y="0" width="${width}" height="${height}" fill="#F5F7FA" />
        
        <!-- Highway Ribbon (Clean Google Maps style corridor) -->
        <path d="${pathD}" fill="none" stroke="#E2E8F0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${pathD}" fill="none" stroke="url(#roadGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="10 4" />

        <!-- Stop Nodes along route -->
        ${stops.map((s, index) => {
          const pt = toSvgCoord(s.lat, s.lng);
          const isTarget = s.id === targetStopId;
          const isBusCurrent = index === bus.currentStopIndex;

          const circleColor = isTarget ? "#1557A6" : isBusCurrent ? "#F59E0B" : "#64748B";
          const radius = isTarget ? 10 : 7;

          return `
            <g class="map-stop-marker" data-stop-id="${s.id}">
              <circle cx="${pt.x}" cy="${pt.y}" r="${radius + 3}" fill="#ffffff" stroke="${circleColor}" stroke-width="3" />
              <circle cx="${pt.x}" cy="${pt.y}" r="${radius}" fill="${circleColor}" />
              <text x="${pt.x}" y="${pt.y - 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#172033">
                ${s.name.split(' - ')[0]} ${isTarget ? '⭐ (Your Stop)' : ''}
              </text>
            </g>
          `;
        }).join('')}

        <!-- Live Moving Bus Marker -->
        <g class="map-bus-marker" transform="translate(${busCoord.x}, ${busCoord.y})" filter="url(#busGlow)">
          <!-- Pulse radar ring -->
          <circle cx="0" cy="0" r="22" fill="none" stroke="#16A34A" stroke-width="2" opacity="0.6">
            <animate attributeName="r" values="16;32;16" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
          </circle>

          <circle cx="0" cy="0" r="16" fill="#0B1F3A" stroke="#2F80ED" stroke-width="3" />
          <text x="0" y="5" text-anchor="middle" font-size="14" fill="#ffffff">🚌</text>
          
          <!-- Bus ID tooltip badge -->
          <rect x="-35" y="20" width="70" height="20" rx="4" fill="#0B1F3A" stroke="#1557A6" stroke-width="1" />
          <text x="0" y="34" text-anchor="middle" font-size="10" font-weight="800" fill="#FFFFFF">
            ${bus.number}
          </text>
        </g>
      </svg>
    `;
  }
}
