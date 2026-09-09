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
     * Recomendado: usar el usuario demo creado para la demo pública.
     */
    'user_email' => env('DEMO_USER_EMAIL', 'demo@bsolutions.local'),

    /**
     * Rol a asegurar en el usuario demo al entrar.
     * Nota: aun con rol Full, si ERP_PLAN=basico el servidor seguirá limitando módulos.
     */
    'role' => env('DEMO_USER_ROLE', 'Plan Full'),
];
