import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

function ClickToSetMarker({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapAutoFix({ position, zoom }) {
    const map = useMap();

    useEffect(() => {
        // Evita “mapa en blanco” por problemas de tamaño/paint al montar.
        setTimeout(() => {
            try {
                map.invalidateSize();
                map.setView([position.lat, position.lng], zoom, { animate: false });
            } catch {
                // ignore
            }
        }, 50);
    }, [map, position.lat, position.lng, zoom]);

    return null;
}

export default function MapaPicker({
    lat,
    lng,
    onChange,
    heightClassName = 'h-72',
    centerFallback = { lat: 18.4861, lng: -69.9312 }, // Santo Domingo (default)
}) {
    const has = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    const zoom = has ? 15 : 12;
    const position = useMemo(() => {
        if (has) {
            return { lat: Number(lat), lng: Number(lng) };
        }
        return centerFallback;
    }, [has, lat, lng, centerFallback]);

    const pick = useCallback(
        (nlat, nlng) => {
            onChange?.({ lat: Number(nlat), lng: Number(nlng) });
        },
        [onChange],
    );

    // Buscador de direcciones (Nominatim / OpenStreetMap)
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const abortRef = useRef(null);

    useEffect(() => {
        const query = q.trim();
        if (query.length < 4) {
            setResults([]);
            setLoading(false);
            if (abortRef.current) abortRef.current.aborted = true;
            return;
        }

        if (abortRef.current) abortRef.current.aborted = true;
        const abort = { aborted: false };
        abortRef.current = abort;

        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
                const res = await fetch(url, {
                    headers: {
                        Accept: 'application/json',
                    },
                });
                if (!res.ok) throw new Error('search failed');
                const json = await res.json();
                if (abort.aborted) return;
                setResults(
                    (Array.isArray(json) ? json : []).map((r) => ({
                        display_name: r.display_name,
                        lat: Number(r.lat),
                        lng: Number(r.lon),
                    })),
                );
            } catch {
                if (!abort.aborted) setResults([]);
            } finally {
                if (!abort.aborted) setLoading(false);
            }
        }, 350);

        return () => {
            abort.aborted = true;
            clearTimeout(t);
        };
    }, [q]);

    const usarMiUbicacion = async () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => pick(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2">
                <div>
                    <div className="relative">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar dirección (ej: Av. 27 de Febrero, Santo Domingo)"
                            className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary-container focus:ring-primary-container/20"
                        />
                        {loading ? (
                            <div className="absolute right-3 top-2.5 text-xs text-outline">Buscando…</div>
                        ) : null}
                    </div>

                    {(results ?? []).length ? (
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-outline-variant bg-white shadow-sm">
                            {(results ?? []).map((r, idx) => (
                                <button
                                    key={`${r.lat}-${r.lng}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                        pick(r.lat, r.lng);
                                        setResults([]);
                                    }}
                                    className="block w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container-low"
                                    title={r.display_name}
                                >
                                    {r.display_name}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={usarMiUbicacion}
                    className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                >
                    Usar mi ubicación
                </button>
                <div className="text-xs text-outline">
                    Tip: haz click en el mapa para fijar el pin; también puedes arrastrarlo.
                </div>
                </div>
            </div>

            <div className={`overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm ${heightClassName}`}>
                <MapContainer
                    center={position}
                    zoom={zoom}
                    scrollWheelZoom
                    className="h-full w-full"
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapAutoFix position={position} zoom={zoom} />
                    <ClickToSetMarker onPick={pick} />
                    {has ? (
                        <Marker
                            position={position}
                            draggable
                            eventHandlers={{
                                dragend: (e) => {
                                    const p = e.target.getLatLng();
                                    pick(p.lat, p.lng);
                                },
                            }}
                        />
                    ) : null}
                </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface">
                    <span className="font-semibold">Lat:</span> {has ? position.lat.toFixed(6) : '—'}
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface">
                    <span className="font-semibold">Lng:</span> {has ? position.lng.toFixed(6) : '—'}
                </div>
            </div>
        </div>
    );
}

