/** Iconos outline para el menú lateral (24px viewBox). */
export default function SidebarNavIcon({ name, className = 'h-5 w-5 shrink-0' }) {
    const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.75 };

    switch (name) {
        case 'dashboard':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
                </svg>
            );
        case 'notificaciones':
            return (
                <svg {...common}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.5 1.4L4 17h5m6 0a3 3 0 11-6 0h6z"
                    />
                </svg>
            );
        case 'clientes':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
                </svg>
            );
        case 'productos':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h6M18 15l2 2 4-4" />
                </svg>
            );
        case 'inventario':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8-4 8 4v8l-8 4-8-4V8z M4 8l8 4 8-4M12 12v8" />
                </svg>
            );
        case 'almacenes':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                </svg>
            );
        case 'compras':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18l-2 12H5L3 7zM3 7l2-3h14l2 3M9 11h6" />
                </svg>
            );
        case 'ventas':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H5v4M15 19h4v-4M5 19L19 5" />
                </svg>
            );
        case 'ventas_mayor':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h6M18 8l2 2 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 16h2v2h-2v-2zM14 16h2v2h-2v-2zM10 16h2v2h-2v-2z" />
                </svg>
            );
        case 'facturas':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z" />
                </svg>
            );
        case 'financiamientos':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 7h11M5 17h11M8 11h8" />
                </svg>
            );
        case 'cobros':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M6 12H3m18 0h-3M7.5 7.5L6 6m12 12l-1.5-1.5M7.5 16.5L6 18m12-12l-1.5 1.5" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        case 'rutas':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.5-6-10a6 6 0 1112 0c0 5.5-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2" />
                </svg>
            );
        case 'garantias':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v6c0 4-2.5 7.5-8 10-5.5-2.5-8-6-8-10V7l8-4z" />
                </svg>
            );
        case 'servicio':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6.5L8 4 4 8l2.5 2.5M13.5 17.5L16 20l4-4-2.5-2.5M8 16l-3 3M16 8l3-3M9 9l6 6" />
                </svg>
            );
        case 'apartados':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            );
        case 'caja':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8zM7 10V8a5 5 0 0110 0v2" />
                </svg>
            );
        case 'gastos':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h10M4 14h14M4 18h8" />
                </svg>
            );
        case 'reportes':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M8 17V9m4 8V7m4 10v-6m4 8V11" />
                </svg>
            );
        case 'usuarios':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
                </svg>
            );
        case 'roles':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v3m-4-3v3m8-3v3M6 9h12M8 5h8l2 4H6l2-4z" />
                </svg>
            );
        case 'config':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19 12h2M3 12H1m15.07-6.07l1.41-1.41M4.52 19.48l1.42-1.42m11.55 1.42l1.41 1.41M4.52 4.52L5.93 5.93" />
                </svg>
            );
        default:
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
                </svg>
            );
    }
}
