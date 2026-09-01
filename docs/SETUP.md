# Cómo hacer funcionar el Portal TallerPro360 desde cero

Esta guía asume un proyecto ya clonado. Cubre desde los prerrequisitos de Azure hasta la publicación en AWS.

## 1. Prerrequisitos de Azure (ya configurados en este proyecto)

| Dato | Valor |
|---|---|
| Tenant | TallerPro360 |
| Subdominio | taller360pro8 |
| Tenant ID | 4ff72935-bed9-42bb-847f-aad6590724eb |
| Client ID Portal | 3fdc00e5-5ecb-451a-857a-da2b411959c8 |
| Client ID API | (pendiente, actividad 1.3.1) |

Si se parte de cero, hay que:
1. Crear un tenant External ID en portal.azure.com (Crear recurso -> buscar "external id").
2. Registrar la aplicación del portal (Entra ID -> Registros de aplicaciones -> Nuevo registro), tipo "Solo cuentas de este directorio organizativo".
3. Convertirla a plataforma SPA, con Redirect URI http://localhost:5173.
4. Crear un usuario de prueba dentro del tenant (Entra ID -> Usuarios -> Nuevo usuario). El correo institucional no sirve, pertenece a otro directorio.

## 2. Configurar el proyecto local

    git clone https://github.com/BenjaFlores379/portal-tallerpro360.git
    cd portal-tallerpro360
    npm install

Revisar que src/authConfig.js tenga el subdominio, Tenant ID y Client ID correctos.

## 3. Correr en local

    npm run dev

Abre http://localhost:5173. Debe verse la pantalla de acceso. Al iniciar sesión, el navegador redirige al dominio del tenant (ciamlogin.com) y vuelve con el panel mostrando nombre y correo reales.

## 4. Compilar para producción

    npm run build

Genera la carpeta dist/. Se sube el CONTENIDO de esa carpeta (no la carpeta en sí) a un bucket S3.

## 5. Publicar en AWS

1. AWS Academy -> Start Lab -> consola, región us-east-1.
2. Crear bucket S3, con bloqueo de acceso público ACTIVADO (no desactivar).
3. Subir el contenido de dist/ al bucket.
4. Crear distribución CloudFront: origen el bucket, Origin Access Control nuevo, redirigir HTTP a HTTPS, default root object index.html.
5. Pegar en el bucket la política que entrega CloudFront.
6. Anotar el dominio de CloudFront.
7. En Azure, agregar ese dominio como segunda Redirect URI de la app SPA, con barra final.

## 6. Verificación final

- Incógnito sin sesión: solo pantalla de acceso.
- Login: panel con nombre real.
- Logout + botón atrás: no debe reaparecer el panel.
- Acceso desde el celular con datos móviles: debe funcionar igual.
- Si se sube código nuevo, crear invalidación /* en CloudFront o se sigue viendo la versión anterior.

## Errores comunes

| Error | Causa |
|---|---|
| AADSTS9002326 | La app quedó registrada como Web en vez de SPA |
| AADSTS50011 | Redirect URI no coincide con ninguna registrada |
| AADSTS50020 | Se usó el correo institucional en vez de un usuario del tenant |
| endpoints_resolution_error | Falta declarar ambos dominios en knownAuthorities |
| 403 AccessDenied en CloudFront | Falta el default root object o la política de bucket |