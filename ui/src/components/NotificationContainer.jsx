import React, { useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import { X } from 'lucide-react';
import './Notification.css';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map((note) => {
        return (
          <div key={note.id} className={`notification-item ${note.type}`}>
            <div className="notification-scanline"></div>
            <div className="notification-glitch-overlay"></div>
            <div className="notification-content">
              <span className="notification-prefix">{note.prefix}</span>
              <span className="notification-message">
                {note.type === 'error' ? '!! ERROR !! ' : ''}
                {note.type === 'success' ? '>> SUCCESS << ' : ''}
                {note.message.toUpperCase()}
              </span>
              <span className={`notification-cursor ${note.type}`}>_</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => removeNotification(note.id)}
            >
              [X]
            </button>
          </div>
        );
      })}
    </div>
  );
}
