import '../css/app.css';
import './bootstrap';

import 'leaflet/dist/leaflet.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { applyLeafletDefaultIconFix } from './lib/leafletDefaultIcon';

const appName = import.meta.env.VITE_APP_NAME || 'ERP Bsolutions Finanzas';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        applyLeafletDefaultIconFix();
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
