import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { latLonToWorld } from './utils';
import Popup from './Popup';

const SCHEDULE_API = 'https://www.emfcamp.org/schedule/2024.json';
const POLL_INTERVAL_MS = 60000; // 60 seconds

const ScheduleLayer = ({ visible = true }) => {
    const [events, setEvents] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [frameStep, setFrameStep] = useState(0); // Kept for reference if needed, but unused mainly
    const [closingLocation, setClosingLocation] = useState(null);
    const wasMarkerClicked = useRef(false);


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

    // Handle background clicks to close popup
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (wasMarkerClicked.current) {
                wasMarkerClicked.current = false;
                return;
            }

            // Should verify we are not clicking INSIDE the popup (HTML overlay)
            // But Popup prevents propagation, so this listener (on window) might not fire if Popup stops it?
            // Actually, React events propagate to React tree. Native events propagate to window.
            // If Popup.js uses e.stopPropagation() on a React event, does it stop window native click? 
            // Usually yes if attached to document, but let's assume we rely on checking logic.

            // If we have an open location, close it
            setSelectedLocation((prev) => {
                if (prev) {
                    setClosingLocation(prev);
                    return null;
                }
                return prev;
            });
        };

        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    const processEvents = (data) => {
        // Month is 0-indexed: 5 is June. 2024-06-01 14:40:00 (Saturday of EMF 2024)
        const now = new Date(2024, 5, 1, 14, 40, 0);
        const locationMap = new Map();

        data.forEach(event => {
            if (!event.is_from_cfp) return; // Filter out non-CFP events
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

    const handleMarkerClick = (id) => {
        wasMarkerClicked.current = true;
        if (selectedLocation === id) {
            setClosingLocation(id);
            setSelectedLocation(null);
        } else {
            if (selectedLocation) setClosingLocation(selectedLocation);
            setSelectedLocation(id);
        }
    };

    if (!visible) return null;

    return (
        <group>
            {events.map((loc) => (
                <group key={loc.id} position={loc.position}>
                    <EventMarker
                        loc={loc}
                        isSelected={selectedLocation === loc.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMarkerClick(loc.id);
                        }}
                    />

                    {/* Popup Overlay - Render if selected OR closing */}
                    {(selectedLocation === loc.id || closingLocation === loc.id) && (
                        <Html position={[0, 10, 0]} center zIndexRange={[100, 0]}>
                            <Popup
                                event={loc}
                                isExiting={closingLocation === loc.id}
                                onClose={() => {
                                    setClosingLocation(loc.id);
                                    setSelectedLocation(null);
                                }}
                                onExited={() => {
                                    setClosingLocation((prev) => prev === loc.id ? null : prev);
                                }}
                            />
                        </Html>
                    )}
                </group>
            ))}
        </group>
    );
};

const EventMarker = ({ loc, isSelected, onClick }) => {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5; // Rotate 0.5 radians per second
        }
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                onClick={onClick}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <dodecahedronGeometry args={[10]} />
                <meshPhongMaterial color="#22dada" />
            </mesh>
        </group>
    );
};

export default ScheduleLayer;
