import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalInstance';
import App from './App.jsx';

msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch((err) => console.error(err));

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
});