import React, { useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { latLonToWorld } from './utils';
import Popup from './Popup';

const SCHEDULE_API = 'https://www.emfcamp.org/schedule/2024.json';
const POLL_INTERVAL_MS = 60000; // 60 seconds

const ScheduleLayer = ({ visible = true }) => {
    const [events, setEvents] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Fetch and process data
    useEffect(() => {
        if (!visible) return;

        const fetchData = async () => {
            try {
                const response = await fetch(SCHEDULE_API);
                const data = await response.json();
                processEvents(data);
            } catch (error) {
                console.error('Error fetching schedule:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [visible]);

    const processEvents = (data) => {
        // Month is 0-indexed: 5 is June. 2024-06-01 14:40:00 (Saturday of EMF 2024)
        const now = new Date(2024, 5, 1, 14, 40, 0);
        const locationMap = new Map();

        data.forEach(event => {
            const loc = event.venue;
            if (!event.latlon) return; // Skip if no coordinates

            if (!locationMap.has(loc)) {
                locationMap.set(loc, {
                    location: loc,
                    lat: event.latlon[0],
                    lon: event.latlon[1],
                    events: []
                });
            }
            // Parse dates
            // EMF API returns "YYYY-MM-DD HH:MM:SS" which some browsers (Safari/some Node/JS settings) won't parse.
            // Replace space with T to comply with ISO 8601 subset.
            locationMap.get(loc).events.push({
                ...event,
                start: new Date(event.start_date.replace(' ', 'T')),
                end: new Date(event.end_date.replace(' ', 'T'))
            });
        });

        // Determine NOW and NEXT for each location
        const processedLocations = Array.from(locationMap.values()).map(locData => {
            // Sort events by time
            locData.events.sort((a, b) => a.start - b.start);

            const nowEvent = locData.events.find(e => e.start <= now && e.end > now);
            const nextEvent = locData.events.find(e => e.start > now);

            return {
                id: locData.location, // unique ID
                location: locData.location,
                position: latLonToWorld(locData.lat, locData.lon),
                now: nowEvent ? { title: nowEvent.title, time: formatTime(nowEvent.start) + ' - ' + formatTime(nowEvent.end) } : null,
                next: nextEvent ? { title: nextEvent.title, time: formatTime(nextEvent.start) + ' - ' + formatTime(nextEvent.end) } : null
            };
        });

        setEvents(processedLocations);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!visible) return null;

    return (
        <group>
            {events.map((loc) => (
                <group key={loc.id} position={loc.position}>
                    {/* Marker Point */}
                    <mesh
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocation(loc.id === selectedLocation ? null : loc.id);
                        }}
                        onPointerOver={() => document.body.style.cursor = 'pointer'}
                        onPointerOut={() => document.body.style.cursor = 'auto'}
                    >
                        <sphereGeometry args={[10, 16, 16]} />
                        <meshBasicMaterial color="#22dada" />
                    </mesh>

                    {/* Popup Overlay */}
                    {selectedLocation === loc.id && (
                        <Html position={[0, 10, 0]} center zIndexRange={[100, 0]}>
                            <Popup
                                event={loc}
                                onClose={() => setSelectedLocation(null)}
                            />
                        </Html>
                    )}
                </group>
            ))}
        </group>
    );
};

export default ScheduleLayer;
