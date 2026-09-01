# Portal TallerPro360

Portal de técnicos con autenticación real contra Microsoft Entra External ID, y consumo de una API propia protegida con Access Tokens. Proyecto desarrollado para la asignatura **DSY1107 - Cloud Native 1** (Duoc UC).

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React + Vite | Compila a archivos estáticos, sin necesidad de servidor propio |
| Autenticación | `@azure/msal-browser` | Librería oficial de Microsoft para el flujo OAuth2/OIDC desde el navegador (PKCE, redirect, manejo de sesión) |
| Identidad | Microsoft Entra External ID | Proveedor de identidad como servicio (IDaaS); no se programa login propio |
| Hosting | AWS S3 + CloudFront | Archivos estáticos servidos por HTTPS, sin servidor de aplicaciones |
| API | AWS Lambda (Node.js) | Endpoint REST que expone las órdenes de trabajo |

No hay base de datos, backend tradicional ni roles/permisos: es intencional, está fuera del alcance definido por las guías del curso.

## Arquitectura

Usuario → Portal (React, en CloudFront)
→ botón "Iniciar sesión" → loginRedirect() saca al navegador hacia el tenant
→ usuario se autentica en Entra External ID (la app nunca ve la contraseña)
→ tenant redirige de vuelta con el token
→ getAllAccounts() confirma sesión → se muestra el panel
→ idTokenClaims entrega nombre y correo reales
→ panel llama a la API (Lambda) para traer las órdenes
→ logoutRedirect() cierra sesión y vuelve al login


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

# 🚀 Guía de instalación y funcionamiento

Toda la guía paso a paso para levantar este proyecto desde cero —desde los prerrequisitos de Azure hasta la publicación en AWS— está documentada en detalle aquí:

## 📄 [Ver guía completa: docs/SETUP.md](./docs/SETUP.md)

Incluye:
- Configuración del tenant y la app en Azure
- Cómo correr el proyecto en local
- Cómo compilar y publicar en S3 + CloudFront
- Checklist de verificación final
- Tabla de errores comunes y sus causas