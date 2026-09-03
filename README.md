
## Datos de configuración (no sensibles)

Tenant ID y Client ID son identificadores públicos por diseño en aplicaciones SPA (no son secretos, no permiten autenticarse por sí solos). Se documentan aquí para referencia del proyecto.

| Dato | Valor |
|---|---|
| Tenant | TallerPro360 |
| Dominio / subdominio | `taller360pro8.onmicrosoft.com` / `taller360pro8` |
| Tenant ID | `4ff72935-bed9-42bb-847f-aad6590724eb` |
| Client ID — Portal (SPA) | `3fdc00e5-5ecb-451a-857a-da2b411959c8` |
| Client ID — API | `b68d809d-f8b1-4c8d-a890-579acd269020` |
| Endpoint API | `https://dnhrkpbts1.execute-api.us-east-1.amazonaws.com/ordenes` |
| Orígenes CORS permitidos | `http://localhost:5173`, `http://localhost:5174`, dominio de producción S3 |

## Cómo correr el proyecto en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Requiere que la app esté registrada como SPA en Azure con esa Redirect URI (ver actividad 1.2.10).

## Cómo compilar y publicar

```bash
npm run build
```

Sube el contenido de `dist/` (no la carpeta en sí) a un bucket S3 privado, servido por una distribución de CloudFront con HTTPS. Requiere registrar el dominio de CloudFront como segunda Redirect URI en Azure.

## Estado de avance

| Actividad | Qué cubre | Estado |
|---|---|---|
| 1.2.3 — Configurando un Tenant | Creación del tenant Entra External ID | ✅ Completa |
| 1.2.5 — App para usuarios externos | Registro de la aplicación del portal | ✅ Completa |
| 1.2.10 — Portal TallerPro360 | Login/logout, panel protegido, publicación en S3 + CloudFront | ✅ Completa |
| 1.2.11 — Conexión con la API | Panel consumiendo la Lambda de órdenes | ✅ Completa |
| 1.3.1 — Dos tokens, dos propósitos | Registro de app `TallerPro360-API`, scope `Ordenes.Leer`, Access Token propio para la API | ✅ Completa |
| 1.3.2 — Que el token viaje solo | Interceptor `apiFetch` que adjunta el Access Token automáticamente en cada llamada a la API | ✅ Completa |

### Detalle de la 1.3.1 (completa)

Objetivo: que la Lambda deje de aceptar peticiones sin credencial y exija un Access Token con `aud` propio, distinto del ID Token que usa el portal para mostrar el nombre del técnico.

- [x] Parte A — Registrar la app `TallerPro360-API` en el tenant
- [x] Parte B — Exponer el scope `Ordenes.Leer`
- [x] Parte C — Ajustar `requestedAccessTokenVersion` a `2` en el manifiesto
- [x] Parte D — Autorizar al portal a pedir el scope + consentimiento de administrador
- [x] Parte E — Obtener el Access Token con `acquireTokenSilent` y verificar en jwt.ms que `aud` apunta a la API y aparece el claim `scp`

**Verificación en jwt.ms — comparación de claims:**

| Claim | ID Token | Access Token |
|---|---|---|
| `aud` | `3fdc00e5-5ecb-451a-857a-da2b411959c8` (portal) | `b68d809d-f8b1-4c8d-a890-579acd269020` (API) |
| `scp` | No existe | `Ordenes.Leer` |
| `oid` | `454a07d8-a02f-4054-acb2-c098a4428d15` | Idéntico — mismo usuario, identificador estable |
| `iss` | Mismo emisor | Mismo emisor |

El scope completo expuesto por la API: `api://b68d809d-f8b1-4c8d-a890-579acd269020/Ordenes.Leer`

### Detalle de la 1.3.2 (completa)

Objetivo: que el Access Token viaje automáticamente en toda llamada a la API, sin que el código que pide las órdenes tenga que saber nada de identidad ni tokens.

- [x] Interceptor `apiFetch` en `src/api.js`: obtiene el token con `acquireTokenSilent` y lo adjunta como `Authorization: Bearer <token>`
- [x] `fetchOrdenes` en `App.jsx` no menciona MSAL ni tokens — solo llama a `apiFetch`
- [x] Manejo de fallo: si `acquireTokenSilent` lanza `InteractionRequiredAuthError`, se reintenta con `acquireTokenRedirect` en vez de romper la app
- [x] Verificado en la pestaña Network del navegador: la petición `GET /ordenes` sale con status `200` y la cabecera `authorization: Bearer eyJ...` presente

**Bug encontrado y resuelto — CORS en API Gateway (HTTP API):**

Al agregar la cabecera `Authorization`, el navegador dispara un preflight `OPTIONS` que la API debe responder con las cabeceras CORS correctas. La consola web de AWS API Gateway guardó `Access-Control-Allow-Headers` como un único string con comas (`"content-type, authorization, x-amz-date, x-api-key"`) en vez de un array de 4 valores separados, lo que hacía fallar el preflight silenciosamente (`HTTP 204` sin ninguna cabecera CORS en la respuesta).

Se corrigió actualizando la configuración directamente por AWS CLI:

```bash
aws apigatewayv2 update-api --api-id dnhrkpbts1 --cors-configuration AllowOrigins="https://tallerpro360-benjamin-2026.s3.us-east-1.amazonaws.com,http://localhost:5173,http://localhost:5174",AllowMethods="GET,OPTIONS",AllowHeaders="content-type,authorization,x-amz-date,x-api-key",AllowCredentials=false,MaxAge=0
```

Verificado con:

```bash
curl -i -X OPTIONS https://dnhrkpbts1.execute-api.us-east-1.amazonaws.com/ordenes -H "Origin: http://localhost:5174" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization"
```

Lección: en HTTP API de API Gateway, si agregas o cambias cabeceras autenticadas (`Authorization`) después de configurar CORS, hay que revisar que el preflight las acepte — no basta con configurarlo una vez, y conviene validar por CLI si la consola web se comporta de forma rara.

## Requisitos cumplidos (actividad 1.2.10)

- **R1** Dos pantallas: acceso (solo botón) y panel de técnico
- **R2** Login ocurre en el tenant — la app nunca ve la contraseña
- **R3** Panel protegido: sin sesión activa solo se muestra la pantalla de acceso
- **R4** Panel con datos reales extraídos de `idTokenClaims`
- **R5** Logout funcional, vuelve a la pantalla de acceso
- **R6** Publicado en internet vía CloudFront, con HTTPS

## Notas técnicas importantes

- La app del portal está registrada como **SPA**, no como Web — de lo contrario el navegador no puede canjear el código de autorización (`AADSTS9002326`).
- `knownAuthorities` en `authConfig.js` declara ambos dominios (subdominio y Tenant ID en `.ciamlogin.com`), porque los tenants External ID emiten tokens cuyo emisor usa el GUID, no el nombre.
- El `redirectUri` se calcula con `window.location.origin`, para que el mismo build funcione tanto en local como en CloudFront sin recompilar.
- El ID Token y el Access Token tienen distinto `aud` a propósito: uno identifica al usuario ante el portal, el otro autoriza al portal a llamar a la API con un permiso concreto (`scp`).
- La instancia de MSAL vive en `src/msalInstance.js`, compartida entre `main.jsx` (arranque de la app) y `api.js` (interceptor), para no duplicarla.
- El interceptor `apiFetch` nunca guarda el Access Token en una variable propia: lo pide en cada llamada vía `acquireTokenSilent`, que usa la caché interna de MSAL y renueva en segundo plano cuando expira.

# 🚀 Guía de instalación y funcionamiento

Toda la guía paso a paso para levantar este proyecto desde cero —desde los prerrequisitos de Azure hasta la publicación en AWS— está documentada en detalle aquí:

## 📄 [Ver guía completa: docs/SETUP.md](./docs/SETUP.md)

Incluye:
- Configuración del tenant y la app en Azure
- Cómo correr el proyecto en local
- Cómo compilar y publicar en S3 + CloudFront
- Checklist de verificación final
- Tabla de errores comunes y sus causas