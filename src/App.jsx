import { useState, useEffect } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { loginRequest, apiRequest } from './authConfig';

const API_URL = "https://dnhrkpbts1.execute-api.us-east-1.amazonaws.com/ordenes";

function LoginScreen() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Portal TallerPro360</h1>
      <p>Acceso exclusivo para personal autorizado</p>
      <button 
        onClick={handleLogin}
        style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Iniciar sesión
      </button>
    </div>
  );
}

function TecnicoPanel() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const claims = account?.idTokenClaims || {};

  const nombreTecnico = claims.name || claims.given_name || "Técnico Registrado";
  const correoTecnico = claims.preferred_username || claims.email || account?.username || "Sin correo";

  const [ordenes, setOrdenes] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [accessToken, setAccessToken] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    fetch(API_URL)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((datos) => {
        setOrdenes(datos);
        setEstado("listo");
      })
      .catch((err) => {
        console.error(err);
        setEstado("error");
      });
  }, []);

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const handleObtenerAccessToken = async () => {
    setTokenError("");
    try {
      const resultado = await instance.acquireTokenSilent({
        ...apiRequest,
        account: account
      });
      console.log("ID Token:", account.idToken);
      console.log("Access Token (API):", resultado.accessToken);
      setAccessToken(resultado.accessToken);
    } catch (err) {
      console.error(err);
      setTokenError("Error al obtener el token: " + err.message);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <h2>TallerPro360 - Panel del Técnico</h2>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cerrar sesión
        </button>
      </header>

      <section style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f4f4f4', borderRadius: '6px' }}>
        <h3>Bienvenido, {nombreTecnico}</h3>
        <p><strong>Correo:</strong> {correoTecnico}</p>
      </section>

      <section style={{ marginTop: '30px', padding: '15px', backgroundColor: '#eef7ff', borderRadius: '6px' }}>
        <h3>Actividad 1.3.1 - Access Token para la API</h3>
        <button
          onClick={handleObtenerAccessToken}
          style={{ padding: '10px 18px', backgroundColor: '#107c10', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Obtener Access Token de la API
        </button>
        {tokenError && <p style={{ color: '#d9534f' }}>{tokenError}</p>}
        {accessToken && (
          <div style={{ marginTop: '15px' }}>
            <p><strong>Access Token (revisa también la consola del navegador):</strong></p>
            <textarea
              readOnly
              value={accessToken}
              style={{ width: '100%', height: '120px', fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
        )}
      </section>

      <section style={{ marginTop: '30px' }}>
        <h3>Órdenes Asignadas</h3>

        {estado === "cargando" && (
          <p style={{ color: '#0078d4', fontWeight: 'bold' }}>Cargando órdenes desde la API...</p>
        )}

        {estado === "error" && (
          <p style={{ color: '#d9534f', fontWeight: 'bold' }}>Error al obtener las órdenes desde la API.</p>
        )}

        {estado === "listo" && (
          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#eaeaea' }}>
                <th>ID Orden</th>
                <th>Descripción</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((ot) => (
                <tr key={ot.id}>
                  <td>{ot.id}</td>
                  <td>{ot.descripcion}</td>
                  <td>{ot.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function App() {
  return (
    <>
      <UnauthenticatedTemplate>
        <LoginScreen />
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <TecnicoPanel />
      </AuthenticatedTemplate>
    </>
  );
}