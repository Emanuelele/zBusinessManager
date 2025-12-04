import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useNuiEvent from './hooks/useNuiEvent';
import useSimulatedClick from './hooks/useSimulatedClick';
import useKeyboardBridge from './hooks/useKeyboardBridge';
import useScrollBridge from './hooks/useScrollBridge';
import { ModuleProvider } from './contexts/ModuleContext';
import TerminalLayout from './components/TerminalLayout.jsx';
import Cursor from './components/Cursor';
import Login from './pages/Login';
import Home from './pages/Home';
import { getAllModules } from './modules/registry';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import './App.css';

import DebugProfiler from './components/DebugProfiler';

// Componente interno per gestire gli eventi che necessitano del contesto notifiche
function AppContent({ isDev, isVisible, isLoggedIn, setIsVisible, setIsLoggedIn, setBusinessId, setBusinessLabel, setBusinessData, businessId, businessData }) {
  const { addNotification } = useNotification();

  // Ascolta eventi da DUI (formato diretto, non wrapped in data) - SOLO in produzione
  useEffect(() => {
    if (isDev) return; // Skip in dev mode
    
    const handleMessage = (event) => {
      const message = event.data;

      // Ignora eventi gestiti da altri hook
      if (message.action === 'keypress' || message.action === 'click' || message.action === 'cursorMove') {
        return;
      }

      if (message.action === 'open') {
        setIsVisible(true);
        setBusinessId(message.business);
        setBusinessLabel(message.businessLabel);
        setIsLoggedIn(false);
      } else if (message.action === 'close') {
        setIsVisible(false);
        setIsLoggedIn(false);
        setBusinessId(null);
        setBusinessData(null);
      } else if (message.action === 'notification') {
        addNotification(message.type, message.message);
      }
    };

    window.addEventListener('message', handleMessage);
    //console.log('App component mounted');
    return () => window.removeEventListener('message', handleMessage);
    
  }, [isDev, setIsVisible, setBusinessId, setBusinessLabel, setIsLoggedIn, setBusinessData, addNotification]);

  // Gestione ESC per chiudere - SOLO in produzione
  useEffect(() => {
    if (isDev) return; // Skip in dev mode
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        fetch(`https://${GetParentResourceName()}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible, isDev]);

  // Hooks per input simulati (DUI)
  useSimulatedClick();
  useKeyboardBridge();
  useScrollBridge();

  // Gestione navigazione interna basata su stato login
  if (!isVisible && !isDev) return null;

  return (
    <DebugProfiler id="MainApp">
      <div className="app-container">
        <Cursor />
        <NotificationContainer />
        
        {!isLoggedIn ? (
          <Login 
            onLoginSuccess={(data) => {
              setIsLoggedIn(true);
              if (data) setBusinessData(data);
            }}
            businessId={businessId} 
          />
        ) : (
          <TerminalLayout 
            businessLabel={businessData?.label || "TERMINAL"} 
            businessId={businessId}
            isLoggedIn={isLoggedIn}
            onLogout={() => setIsLoggedIn(false)}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              
              <Route path="/home" element={<Home businessId={businessId} />} />

              {/* Dynamic Module Routes */}
              {getAllModules().map(module => (
                <Route 
                  key={module.id}
                  path={module.path}
                  element={<module.component businessId={businessId} />}
                />
              ))}
            </Routes>
          </TerminalLayout>
        )}
      </div>
    </DebugProfiler>
  );
}

function App() {
  // DEV MODE: salta login se siamo in sviluppo
  const isDev = import.meta.env.DEV;
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [businessLabel, setBusinessLabel] = useState('');
  const [businessData, setBusinessData] = useState(null);

  useEffect(() => {
    if (isDev) {
      setIsVisible(true);
      setBusinessId('pipedown');
      setBusinessLabel('Pipe Down');
      setIsLoggedIn(true);
    }
  }, [isDev]);

  return (
    <HashRouter>
      <ModuleProvider>
        <NotificationProvider>
          <AppContent 
            isDev={isDev}
            isVisible={isVisible}
            isLoggedIn={isLoggedIn}
            setIsVisible={setIsVisible}
            setIsLoggedIn={setIsLoggedIn}
            setBusinessId={setBusinessId}
            setBusinessLabel={setBusinessLabel}
            setBusinessData={setBusinessData}
            businessId={businessId}
            businessData={businessData}
          />
        </NotificationProvider>
      </ModuleProvider>
    </HashRouter>
  );
}

// Helper per ottenere il nome della risorsa
function GetParentResourceName() {
  return 'zBusinessManager';
}

export default App;
