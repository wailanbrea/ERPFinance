# ERP Bsolutions Finanzas (ERP Finance)

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

Sistema Web Integral de Gestión Empresarial (ERP) especialmente diseñado para comercios con venta al contado y **financiamiento a crédito** (electrodomésticos, motocicletas y motores, plásticos, muebles, tecnología y retail en general).

El sistema cubre el ciclo operativo completo: desde compras e inventarios multialmacén, facturación rápida en punto de venta (POS) con impresión térmica local y gaveta de dinero, hasta liquidación de amortizaciones semanales, quincenales o mensuales, control de mora, cobranza en calle mediante rutas georreferenciadas en mapa interactivo, garantías y servicio técnico.

---

## 📑 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Módulos del Sistema](#-módulos-del-sistema)
   - [Dashboard Ejecutivo](#1-dashboard-ejecutivo)
   - [Clientes y Créditos](#2-clientes-y-crm-financiero)
   - [Catálogo de Productos, Categorías y Marcas](#3-catálogo-de-productos-categorías-y-marcas)
   - [Inventario, Almacenes y Kardex](#4-inventario-almacenes-y-kardex)
   - [Compras y Proveedores](#5-compras-y-proveedores)
   - [Punto de Venta (POS) y Facturación](#6-punto-de-venta-pos-y-facturación)
   - [Motor de Financiamiento y Amortizaciones](#7-motor-de-financiamiento-y-amortizaciones)
   - [Cobros y Rutas de Cobranza con Mapa](#8-cobros-y-rutas-de-cobranza-con-mapa)
   - [Garantías y Servicio Técnico](#9-garantías-y-servicio-técnico)
   - [Caja y Control de Gastos](#10-caja-y-control-de-gastos)
   - [Centro de Notificaciones](#11-centro-de-notificaciones)
   - [SuperAdmin y Multi-Empresa](#12-superadmin-y-multi-empresa)
4. [Integración con Hardware POS (BSM-POS Windows Agent)](#-integración-con-hardware-pos-bsm-pos-windows-agent)
5. [Requisitos del Entorno](#-requisitos-del-entorno)
6. [Instalación Local Paso a Paso](#-instalación-local-paso-a-paso)
7. [Usuarios y Credenciales de Demostración](#-usuarios-y-credenciales-de-demostración)
8. [Pruebas y Calidad de Código](#-pruebas-y-calidad-de-código)
9. [Despliegue en Producción](#-despliegue-en-producción)

---

## 🌟 Características Principales

* **Esquema de Venta Dual:** Ventas de contado directo, al por mayor y planes de crédito financiados.
* **Flexibilidad en Cuotas:** Cálculo y amortización de pagos con periodicidad semanal, quincenal y mensual.
* **Control de Mora Automatizado:** Cálculo de días de atraso, recargos y estado crediticio de clientes.
* **Rutas de Cobro Inteligentes:** Mapeo georreferenciado con OpenStreetMap / Leaflet y reordenamiento de paradas para cobradores de calle.
* **Multi-Empresa / Multi-Inquilino:** Separación estricta de datos por empresa y sucursal mediante scopes globales de Eloquent.
* **Seguridad y Permisos Granulares:** Basado en roles y permisos con Spatie Laravel Permission (SuperAdmin, Administrador, Vendedor, Cobrador, Técnico).
* **Impresión Térmica Silenciosa:** Comunicación nativa con impresoras ESC/POS (80mm/58mm) y apertura de gaveta de dinero mediante agente local HTTP con firmas HMAC-SHA256.
* **Trazabilidad y Kardex:** Registro de movimientos de inventario por almacén, transferencias auditadas y motivos de ajuste.

---

## 🛠️ Arquitectura y Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Backend** | Laravel 12.x / PHP 8.2+ | Arquitectura robusta basada en controladores, políticas, migraciones y eventos. |
| **Frontend** | Inertia.js 2.x + React 18.x | Experiencia SPA moderna y reactiva sin duplicar endpoints ni serializadores complejos. |
| **Estilos UI** | Tailwind CSS 3.x + Headless UI | Interfaz intuitiva, adaptativa a terminales de escritorio, tablets y móviles. |
| **Compilador** | Vite 7.x | Empaquetado optimizado con división de código por módulos (*code splitting*). |
| **Mapas** | Leaflet + React Leaflet | Visualización de coordenadas geográficas de clientes y rutas de cobro. |
| **Base de Datos** | MySQL 8.x / MariaDB | Relacional con llaves foráneas, índices compuestos e integridad referencial. |
| **Testing** | PHPUnit 11 + Node Test Runner | 45 pruebas PHP aisladas en SQLite en memoria y 7 pruebas JS de protocolo. |
| **Periféricos** | BSM-POS Windows Agent | Microservicio local en Windows (:8765) para acceso directo a hardware POS. |

---

## 📦 Módulos del Sistema

### 1. Dashboard Ejecutivo
* **Métricas en tiempo real:** Ventas acumuladas del día, cobros recaudados y balance de caja.
* **Indicadores de cartera:** Monto en cuotas vencidas, clientes en atraso y porcentaje de morosidad.
* **Alertas operativas:** Existencias por debajo del stock mínimo y pólizas de garantía próximas a vencer.
* **Visualización de flujo:** Gráfica comparativa de ventas y cobros por período.

### 2. Clientes y CRM Financiero
* **Ficha completa:** Cédula / RNC, nombres, apellidos, teléfonos y enlace de acceso directo a chat de WhatsApp.
* **Georreferenciación:** Múltiples direcciones registradas con selector en mapa interactivo (latitud y longitud).
* **Referencias y Garantes:** Datos de familiares o avales comerciales con validación de parentesco y teléfonos.
* **Historial 360°:** Resumen consolidado de facturas, financiamientos, cobros aplicados, promesas de pago y garantías.

### 3. Catálogo de Productos, Categorías y Marcas
* **Identificación exhaustiva:** SKU, Código de barras, Código QR y gestión de números de serie únicos.
* **Esquemas de precio:**
  * Costo de adquisición.
  * Precio de contado.
  * Precio al por mayor.
  * Precio financiado para ventas a crédito.
* **Categorización y Marcas:** Clasificación con tiempo estándar de garantía por línea de producto e imagen.

### 4. Inventario, Almacenes y Kardex
* **Multi-Almacén:** Gestión de existencias por sucursales y bodegas físicas.
* **Operaciones:**
  * Entrada de mercancía por compras o devoluciones.
  * Salida por ventas o bajas operativas.
  * Transferencias inter-almacenes con confirmación de recepción.
  * Ajustes de inventario auditados con especificación de motivo.
* **Kardex Valorizado:** Histórico cronológico de entradas, salidas, balance y costo unitario.

### 5. Compras y Proveedores
* **Gestión de suplidores:** RNC, contacto, teléfono, dirección y condiciones de pago.
* **Registro de compras:** Carga de facturas de proveedor con desglose automático de ITBIS.
* **Actualización en tiempo real:** Incremento automático del stock y ajuste de costos promedio.

### 6. Punto de Venta (POS) y Facturación
* **Terminal POS:** Búsqueda rápida por lector de código de barras o texto, selector de cliente y cálculo automático de vueltas.
* **Modalidad de Venta:** Contado y Venta al por Mayor con precios especiales.
* **Formatos de comprobante:** Ticket térmico de 80mm / 58mm y Factura PDF en formato carta.
* **Integración de hardware:** Disparo automático de impresión y apertura de cajón de dinero sin diálogos del navegador.

### 7. Motor de Financiamiento y Amortizaciones
* **Cálculo de crédito:** Monto de inicial/enganche, capital financiado, cantidad de cuotas y tasa de interés.
* **Periodicidades soportadas:** Semanal, Quincenal y Mensual.
* **Tabla de amortización:** Generación automática de calendario de vencimientos con capital, interés y balance insoluto.
* **Gestión de Mora:** Cálculo automático de penalidades por días de retraso.

### 8. Cobros y Rutas de Cobranza con Mapa
* **Recepción de pagos:** Aplicación de abonos a cuotas específicas, pagos adelantados o liquidación total con recibo digital/impreso.
* **Promesas de pago:** Registro de compromisos de abono con fecha límite y recordatorios en el sistema.
* **Rutas de Cobro para Cobradores:**
  * Asignación de clientes a rutas y cobradores específicos.
  * Visualización de paradas en el mapa interactivo.
  * Reordenamiento del itinerario de visita para optimizar el recorrido diario.

### 9. Garantías y Servicio Técnico
* **Pólizas de garantía:** Activación inmediata ligada a la venta y serie del equipo vendido.
* **Taller y Servicio Técnico:** Recepción de equipos dañados, emisión de boleta de servicio, registro de diagnóstico, repuestos utilizados, costos de mano de obra y entrega al cliente.

### 10. Caja y Control de Gastos
* **Sesiones de caja:** Apertura con monto base, arqueo de ingresos durante el turno y cierre con verificación de diferencias.
* **Gastos operativos:** Registro clasificado de gastos menores, compras de insumos y comprobantes de desembolso.

### 11. Centro de Notificaciones
* Notificaciones internas en tiempo real para usuarios de la empresa:
  * Cuotas vencidas del día.
  * Clientes en mora.
  * Incumplimiento de promesas de pago.
  * Stock crítico de productos.
* Filtros por estado (leídas/no leídas) y marcado masivo.

### 12. SuperAdmin y Multi-Empresa
* Panel de administración central para gestión de organizaciones (*tenants*).
* Activación, bloqueo y administración de licencias empresariales.
* Restablecimiento y control de administradores de cada empresa.

---

## 🖨️ Integración con Hardware POS (BSM-POS Windows Agent)

El sistema incluye integración nativa con el microservicio **BSM-POS Windows Agent**, el cual se ejecuta en segundo plano en la máquina del cajero (http://127.0.0.1:8765).

* **Seguridad:** Peticiones protegidas mediante cabeceras X-Agent-Timestamp y firma X-Agent-Signature (HMAC-SHA256).
* **Impresión silenciosa:** Envío directo de bytes ESC/POS a impresoras térmicas USB/Red.
* **Cajón de dinero:** Envío del pulso de apertura estándar de solenoide tras registrar un cobro o venta en efectivo.
* **Diagnóstico:** Detección de impresoras instaladas en Windows y emisión de ticket de prueba.

Para más detalles, consulta [docs/BSM-POS-WINDOWS-AGENT.md](docs/BSM-POS-WINDOWS-AGENT.md).

---

## 💻 Requisitos del Entorno

* **PHP:** >= 8.2 con extensiones pdo_mysql, mbstring, openssl, curl, gd, zip, xml.
* **Node.js:** >= 20.x y npm >= 10.x.
* **Base de datos:** MySQL 8.0+ o MariaDB 10.4+.
* **Servidor Web:** Apache (XAMPP / VPS Windows) o Nginx en Linux.
* **Composer:** >= 2.6.

---

## 🚀 Instalación Local Paso a Paso

### 1. Clonar el repositorio y configurar variables de entorno
`powershell
git clone https://github.com/wailanbrea/ERPFinance.git
cd ERPFinance
Copy-Item .env.example .env
`

### 2. Instalar dependencias PHP y JavaScript
`powershell
composer install
npm install
`

### 3. Configurar la clave de cifrado de la aplicación
`powershell
php artisan key:generate
`

### 4. Configurar la base de datos
Crea la base de datos en MySQL (por defecto erp_bsolutions_finanzas en 127.0.0.1:3306) y ajusta tu .env si es necesario:
`env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=erp_bsolutions_finanzas
DB_USERNAME=root
DB_PASSWORD=
`

### 5. Ejecutar migraciones y sembrar datos de prueba
`powershell
php artisan migrate --seed
`

### 6. Compilar recursos del frontend
`powershell
npm run build
`

### 7. Iniciar el servidor de desarrollo
`powershell
php artisan serve
`
El sistema estará disponible en http://localhost:8000.

---

## 👤 Usuarios y Credenciales de Demostración

El seeder inicial genera usuarios con roles preconfigurados listos para operar el sistema en entorno local:

| Rol | Correo Electrónico | Contraseña Local |
| :--- | :--- | :--- |
| **Owner (SuperAdmin)** | `wailandkey@gmail.com` | `Driffgraff09` |
| **Administrador / Demo** | `admin@bsolutions.dev` | `admin1234` |
| **Reynel (Plan Full)** | `reynel@bsolutions.dev` | `reynel1234` |
| **Usuario Demo** | `demo@bsolutions.dev` | `password` |
| **Vendedor** | `vendedor@bsolutions.dev` | `password` |
| **Cobrador** | `cobrador@bsolutions.dev` | `password` |
| **Técnico** | `tecnico@bsolutions.dev` | `password` |

> [!WARNING]
> Estas credenciales son exclusivamente para desarrollo y pruebas. Deben ser cambiadas antes de cualquier despliegue productivo.

---

## 🧪 Pruebas y Calidad de Código

El proyecto cuenta con una suite completa de pruebas automatizadas:

`powershell
# Ejecutar pruebas unitarias y de integración de Laravel (SQLite en memoria)
composer test

# Ejecutar pruebas del protocolo POS y seguridad de tickets en JavaScript
npm test

# Verificar compilación de producción de Vite
npm run build
`

---

## 🌐 Despliegue en Producción

Para desplegar en un servidor Windows VPS con Apache o Linux con Nginx, consulta la guía detallada en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

* Usa siempre .env.production.example como plantilla base.
* Activa APP_ENV=production y APP_DEBUG=false.
* Configura los caches de Laravel (php artisan config:cache, php artisan route:cache, php artisan view:cache).
* Asegúrate de que el agente BSM-POS esté instalado en las terminales con impresora física.
