# Despliegue de ERP Bsolutions Finanzas

## Preparación

1. Copia `.env.production.example` a `.env` en el servidor y completa URL, base de datos, correo y propietario SuperAdmin.
2. Genera una clave nueva con `php artisan key:generate`; no reutilices la clave local.
3. Mantén `APP_ENV=production`, `APP_DEBUG=false` y `DEMO_ENABLED=false`.
4. Usa una cuenta de base de datos dedicada con privilegios solo sobre la base de esta instalación.
5. Cambia o elimina todas las credenciales sembradas antes de permitir acceso externo.

## Publicación

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan migrate --force
php artisan optimize
php artisan storage:link
```

Configura el servidor web para servir únicamente el directorio `public`. El proceso de colas debe ejecutar `php artisan queue:work` bajo un supervisor y reiniciarse en cada despliegue.

## Verificación

1. Confirma que `/login` carga por HTTPS y que no expone errores detallados.
2. Inicia sesión con una cuenta de producción y revisa dashboard, clientes, productos, ventas, facturas, financiamientos, cobros, caja y reportes.
3. Ejecuta una venta de prueba y comprueba inventario, factura, movimientos de caja y reportes.
4. Verifica copias de seguridad de la base y una restauración de prueba.
5. En cada equipo Windows, valida el estado del BSM-POS Windows Agent y una impresión física antes de operar.

## Regreso a una versión anterior

Conserva el artefacto de la versión anterior y una copia de la base tomada antes de migrar. El código puede volver a publicarse; una migración de datos solo debe revertirse cuando su método `down` sea seguro para la información existente.
