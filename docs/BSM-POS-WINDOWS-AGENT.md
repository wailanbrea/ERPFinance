# Integración BSM-POS Windows Agent

El ERP usa el agente Windows publicado en:

`https://github.com/wailanbrea/bsmpos-windows-agent`

La versión comprobada el 8 de septiembre de 2026 es `d8baab109180e15d810671636f6a3c07af9b4115`.
El código local del agente instalado en `Sistema de Facturacion Saas/agent` coincide con esa versión.

## Flujo

```text
ERP (navegador) -> http://127.0.0.1:8765 -> BSM-POS Windows Agent -> impresora/gaveta Windows
```

El backend del ERP genera el texto del ticket en `FacturaTicketService`. El navegador obtiene ese texto en
`GET /facturas/{venta}/ticket` y lo envía a `POST /api/print`. La operación de venta no se repite si la
impresión falla o si la respuesta de impresión se pierde.

## Configuración

En `Configuración → Conexión con Windows` el usuario puede:

- comprobar `/api/status`;
- detectar impresoras, Bluetooth y puertos seriales mediante `/api/devices`;
- guardar la impresora por empresa, sucursal y usuario;
- enviar una prueba a `/api/test`.

El token del agente, si existe, se conserva únicamente en memoria de la página. Las solicitudes protegidas
usan `X-Agent-Token`, `X-Agent-Timestamp` y `X-Agent-Signature` con HMAC-SHA256, igual que el agente.

## Impresión física

Detectar el agente o una impresora no confirma que el papel haya salido. Antes de operar en producción hay que
probar cada terminal con `/api/test`, verificando papel, Bluetooth/SPP o puerto COM. Un `404` indica que la
impresora guardada ya no existe; `503` indica que el hardware no está disponible.

La instalación del servicio y sus cambios de firewall requieren PowerShell como Administrador. El ERP no
intenta elevar privilegios ni modificar la instalación del agente automáticamente.
