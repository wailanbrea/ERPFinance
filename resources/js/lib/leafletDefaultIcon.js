import L from 'leaflet';

// Fix de iconos en bundlers (Vite): Leaflet no resuelve rutas por defecto.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export function applyLeafletDefaultIconFix() {
    // Evitar warnings por intentar cargar imágenes desde /images inexistente
    // eslint-disable-next-line no-underscore-dangle
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
    });
}

