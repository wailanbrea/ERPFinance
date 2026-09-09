import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function ModulePlaceholder({ title, description }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">{title}</h1>
                    {description ? (
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            {description}
                        </p>
                    ) : null}
                </div>
            }
        >
            <Head title={title} />
            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="text-body-md text-on-surface">
                    Módulo en construcción.
                </div>
                <div className="mt-2 text-body-md text-on-surface-variant">
                    Ya está conectado en rutas y navegación. En los siguientes pasos
                    se implementará el CRUD, flujos y reportes según el documento.
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

