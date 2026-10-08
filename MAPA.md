# Mapa de archivos — La Catalina

Referencia rápida de qué hay en cada archivo. No se usa en la app (no lo
subas junto con los `.js`) — es solo para encontrar las cosas más rápido
la próxima vez que haga falta tocar algo.

| Archivo | Qué tiene adentro |
|---|---|
| **01-temas.js** | Los 20 temas visuales (10 colores × Clásico/Metálico), la función `aplicarTemaLC` que los pinta, y el efecto de textura de fibra de carbono. |
| **03-utils.js** | Piezas reusables que aparecen en varias pantallas: `PieEnvases` (el panel "♻️ Envases" de cada cliente), `FormCliente` (el formulario de alta/edición), `HeaderApp`/`HeaderBotones` (encabezado con sol/luna). También la función `direccionCliente` que arma la dirección completa. |
| **04-portada.js** | La pantalla de entrada, el selector de fecha, `SyncBar` (la barrita de "Guardado"/"Sin conexión" arriba de todo), y la pantalla de bloqueo con PIN/huella. |
| **05-stock.js** | Todo Stock: Sodería, Depósito, En clientes, Pérdidas, Productos y precios, Carga diaria, y el Total general. |
| **06-menu.js** | El menú de días, la planilla del día (carga inicial + cierre), el detalle de transferencias y de ventas del día. |
| **07-clientes.js** | La lista de clientes del día a día, el detalle de un cliente (con su historial), Fiados pendientes, y Clientes dormidos. |
| **08-ventas.js** | La pantalla de registrar una venta, el formulario de nuevo cliente, mantenimiento del vehículo, recordatorios, cobro de saldo/deuda. |
| **09-promocion.js** | *(ELIMINADO — ya no se usa ni se carga. Podés borrar el archivo del repositorio.)* |
| **10-gestion.js** | Gestión de clientes (todos los días juntos, reordenar, cambio de envases), carga masiva de GPS, mapa de clientes. |
| **12-config.js** | La pantalla de Configuración completa: notificaciones, huella, respaldo, mantenimiento de datos. |
| **13-agenda.js** | La Agenda (recordatorios de visita/cobro) y el selector de apariencia (temas). |
| **14-app.js** | El componente principal (`App`) — acá vive casi todo el estado (clientes, ventas, stock...), la sincronización con la nube (`syncData`, los merge de cada tipo de dato), y el router de pantallas. Es el archivo más grande y el que más conviene mirar primero si algo no anda. |
| **sw.js** | El service worker — cache offline y notificaciones push cuando la app está cerrada. |

## Si algo no sincroniza bien

Mirá primero el bloque grande de comentarios en `14-app.js`, justo donde
empieza `cloudLoad().then(...)` — ahí está explicado el patrón de merge
que usan clientes/ventas/planillas/noVisitas, y el bug real que ya pasó
una vez (comparación con `>=` en vez de `>`, que gastó toda la cuota
gratuita de Firestore en un día).

## Si algo no se ve bien (colores, tamaños)

Los colores salen todos de `01-temas.js` — es un solo lugar para las 3
apps (La Catalina, Individual, Multi comparten la misma estructura de
archivo, aunque con distinta ubicación de negocio).
