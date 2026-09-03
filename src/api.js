import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance } from "./msalInstance";
import { apiRequest } from "./authConfig";

// Interceptor: obtiene el token en silencio y lo adjunta a toda petición.
// Nadie que llame a apiFetch necesita saber que MSAL existe.
export async function apiFetch(url, opciones = {}) {
  const cuenta = msalInstance.getAllAccounts()[0];
  if (!cuenta) {
    throw new Error("No hay sesión iniciada");
  }

  let resultado;
  try {
    resultado = await msalInstance.acquireTokenSilent({
      ...apiRequest,
      account: cuenta
    });
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(apiRequest);
      return;
    }
    throw error;
  }

  return fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${resultado.accessToken}`
    }
  });
}