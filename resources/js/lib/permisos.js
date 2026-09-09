import { usePage } from '@inertiajs/react';

export function usePermisos() {
    const { auth } = usePage().props;
    return new Set(auth?.permisos ?? []);
}

export function usePuede(permiso) {
    const permisos = usePermisos();
    return permisos.has(permiso);
}

export function Puede({ permiso, children, fallback = null }) {
    const ok = usePuede(permiso);
    return ok ? children : fallback;
}

