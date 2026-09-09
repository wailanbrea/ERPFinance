<?php

return [
    /**
     * Demo pública: permite entrar y navegar sin editar datos.
     *
     * Activación: DEMO_ENABLED=true
     * Usuario: DEMO_USER_EMAIL (se loguea automáticamente en /demo)
     */
    'enabled' => (bool) env('DEMO_ENABLED', false),

    /**
     * Email del usuario demo existente.
     * Por defecto: admin@bsolutions.dev
     */
    'user_email' => env('DEMO_USER_EMAIL', 'admin@bsolutions.dev'),

    /**
     * Lista de correos con comportamiento demo (solo lectura si DEMO_ENABLED=true).
     * Por defecto incluye admin@bsolutions.dev y demo@bsolutions.dev.
     */
    'user_emails' => array_values(array_unique(array_filter(array_map('trim', explode(',', env('DEMO_USER_EMAILS', env('DEMO_USER_EMAIL', 'admin@bsolutions.dev') . ',demo@bsolutions.dev')))))),

    /**
     * Rol a asegurar en el usuario demo al entrar.
     * Nota: aun con rol Full, si ERP_PLAN=basico el servidor seguirá limitando módulos.
     */
    'role' => env('DEMO_USER_ROLE', 'Plan Full'),
];
