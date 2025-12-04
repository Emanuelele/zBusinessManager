import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const playBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square'; // Retro square wave
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Ignore audio errors (autoplay policy etc)
    }
  }, []);

  const prefixes = [
    '>> SYSTEM_MSG:',
    '// KERNEL_LOG:',
    '[ROOT_ACCESS]:',
    '>> BUFFER_OUT:',
    ':: TERMINAL ::',
    '$$ EXEC_CMD:',
  ];

  const getRandomPrefix = () => prefixes[Math.floor(Math.random() * prefixes.length)];

  const addNotification = useCallback((type, message, duration = 5000) => {
    playBeep();
    const id = Date.now() + Math.random();
    const prefix = getRandomPrefix();
    setNotifications(prev => [...prev, { id, type, message, duration, prefix }]);

    // Auto remove
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, [playBeep]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
