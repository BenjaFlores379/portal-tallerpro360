const SUBDOMINIO = "taller360pro8";
const TENANT_ID = "4ff72935-bed9-42bb-847f-aad6590724eb";
const CLIENT_ID = "3fdc00e5-5ecb-451a-857a-da2b411959c8";
const API_CLIENT_ID = "b68d809d-f8b1-4c8d-a890-579acd269020";

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://${SUBDOMINIO}.ciamlogin.com/${TENANT_ID}`,
    knownAuthorities: [
      `${SUBDOMINIO}.ciamlogin.com`,
      `${TENANT_ID}.ciamlogin.com`
    ],
    redirectUri: window.location.origin + window.location.pathname,
    postLogoutRedirectUri: window.location.origin + window.location.pathname,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: "sessionStorage"
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"]
};

export const apiRequest = {
  scopes: [`api://${API_CLIENT_ID}/Ordenes.Leer`]
};