import { useState, useEffect } from 'react';
import useNuiEvent from '../hooks/useNuiEvent';

function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Rileva dev mode (localhost)
  useEffect(() => {
    setIsDevMode(window.location.hostname === 'localhost');
  }, []);

  // Dev mode: traccia il mouse normale
  useEffect(() => {
    if (!isDevMode) return;

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDevMode]);

  // Prod mode: usa eventi NUI
  useNuiEvent('cursorMove', (data) => {
    if (!isDevMode) {
      setPosition({ x: data.x, y: data.y });
      setVisible(true);
    }
  });

  useNuiEvent('cursorHide', () => {
    if (!isDevMode) {
      setVisible(false);
    }
  });

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 10000,
        filter: 'drop-shadow(0 0 4px var(--terminal-green))'
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L9 20L12.5 12.5L20 9L2 2Z" fill="#000" stroke="var(--terminal-green)" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default Cursor;
