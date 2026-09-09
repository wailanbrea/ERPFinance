---
name: MotoHogar Visual Language
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#3e2400'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c3800'
  on-tertiary-container: '#ef9900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  table-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 260px
  stack-gap: 12px
---

## Brand & Style

The design system for this administrative platform is built upon the concept of **Reliable Efficiency**. It targets administrative personnel and finance managers who require a high-density information environment that doesn't feel overwhelming. 

The style is **Corporate / Modern**, leaning heavily into high-utility minimalism to reduce cognitive load during long work sessions. It balances the robustness of an ERP with the approachability of a modern SaaS. The visual language conveys security and precision—essential for motorcycle and appliance financing—while maintaining a "friendly-professional" tone through ample whitespace and soft elevation.

## Colors

The palette is designed for institutional trust and functional signaling:

- **Primario (Deep Blue):** Utilized for navigation, primary actions, and branding elements to reinforce stability.
- **Éxito (Emerald):** Specifically reserved for "Pagado" (Paid) statuses and completed transaction confirmations.
- **Alerta y Error (Amber/Red):** Used strictly for "Cuotas Vencidas" (Overdue installments) and critical system warnings.
- **Superficies (Grays):** A cool-toned gray scale facilitates a layered interface, separating navigation (darker/saturated) from content areas (clean/light).

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy contexts. The typographic scale is optimized for "Gestión Administrativa":

- **Hierarquía:** Titles are bold and tight to anchor sections. 
- **Tablas:** Data points use a consistent 14px size to maximize information density without sacrificing readability.
- **Etiquetas:** Small caps or medium-weight labels are used for metadata like "NRO. DE CUOTA" or "ESTADO".

## Layout & Spacing

The system employs a **Fixed-Fluid Hybrid** layout:
- **Sidebar:** A fixed left-hand navigation anchored at 260px.
- **Main Content:** A fluid area using a 12-column grid system for internal dashboard widgets.
- **Rhythm:** An 8px base unit drives all dimensions. Page margins are set to 24px to give the data "room to breathe," while internal card padding is 16px to maintain a compact, professional feel.

## Elevation & Depth

To maintain the "Modern Professional" feel, this design system avoids heavy drop shadows. Instead, it uses:

- **Nivel 0 (Fondo):** `#f8fafc` for the main application canvas.
- **Nivel 1 (Cards):** White background with a 1px border in `#e2e8f0` and a very soft ambient shadow (Y: 2px, Blur: 4px, Opacity: 4% Black).
- **Nivel 2 (Modales/Popovers):** A more defined shadow to indicate temporary focus (Y: 10px, Blur: 15px, Opacity: 10% Black).
- **Efectos de Hover:** Table rows and interactive cards use a subtle background shift to `#f1f5f9` rather than an elevation increase.

## Shapes

The design system uses **Soft (0.25rem)** roundedness. 
- **Contenedores y Cards:** 4px to 8px corner radius provides a modern touch while maintaining the structural integrity of an ERP.
- **Botones y Inputs:** Standardized 6px radius to feel ergonomic for frequent mouse interactions.
- **Badges/Tags:** Fully rounded (pill-shaped) to distinguish status indicators (e.g., "Al día", "Vencido") from structural UI elements.

## Components

### Navegación Lateral (Sidebar)
The primary navigation uses the Deep Blue (`#1e3a8a`) for the background or a very high-contrast light mode. Links should feature active states with a left-accent border and a slight opacity shift.

### Tablas de Datos
- **Encabezados:** Light gray background (`#f1f5f9`), 12px uppercase text, semi-bold.
- **Filas:** White background, 48px minimum height, with a `#f8fafc` hover state. 
- **Acciones:** Grouped at the end of the row using ghost buttons to reduce visual noise.

### Formularios de Registro
Inputs must have clear "Label" text above the field. Use `#cbd5e1` for borders, shifting to Primary Blue on focus. Error states for "Campos Obligatorios" must use the Alert Red with descriptive helper text below the input.

### Tarjetas de Resumen (Summary Cards)
Used for KPIs like "Recaudación del Día" or "Motos Entregadas." These feature a prominent icon in the top right, a large H2 value, and a small label for the metric name.

### Botones
- **Primario:** Filled Deep Blue with white text.
- **Secundario:** Outlined Deep Blue.
- **Acción Crítica:** Filled Alert Red (reserved for "Eliminar Registro" or "Anular Pago").