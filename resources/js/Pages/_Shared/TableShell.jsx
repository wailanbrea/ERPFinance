export default function TableShell({ title, description, actions, filters, children }) {
    return (
        <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-h1 font-bold text-on-surface">{title}</h1>
                    {description ? (
                        <p className="mt-1 text-body-md text-on-surface-variant">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
            </div>

            {filters ? (
                <div className="mt-6 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                    {filters}
                </div>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                <div className="overflow-x-auto">{children}</div>
            </div>
        </div>
    );
}

