import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNui } from '../utils/fetchNui';
import './Login.css';

const BOOT_SEQUENCE = [
  "INITIALIZING zBusinessManager KERNEL...",
  "LOADING MEMORY BLOCKS... [OK]",
  "CHECKING PERIPHERALS... [OK]",
  "CONNECTING TO MAINFRAME... [OK]",
  "VERIFYING SECURITY PROTOCOLS... [OK]",
  "LOADING USER INTERFACE MODULES...",
  "SYSTEM READY.",
  "PLEASE AUTHENTICATE."
];

const Login = ({ businessId, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const bootRef = useRef(null);

  // Boot sequence effect
  useEffect(() => {
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < BOOT_SEQUENCE.length) {
        setBootLines(prev => [...prev, BOOT_SEQUENCE[lineIndex]]);
        lineIndex++;
        // Auto scroll
        if (bootRef.current) {
          bootRef.current.scrollTop = bootRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setTimeout(() => setShowForm(true), 500);
      }
    }, 150); // Speed of boot text

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await fetchNui('login', { username, password, businessId });

      if (result.success) {
        onLoginSuccess(result.data);
        navigate('/home');
      } else {
        setError('>> ACCESS DENIED: INVALID CREDENTIALS <<');
      }
    } catch (err) {
      console.error(err);
      setError('>> SYSTEM ERROR: CONNECTION FAILED <<');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      
      <div className="login-frame">
        <div className="login-header">
          <div className="zeta-branding">DEVELOPED BY ZETA</div>
          <h1 className="system-title">zBusinessManager</h1>
          <div className="version-tag">v 2.1</div>
        </div>

        {!showForm ? (
          <div className="boot-sequence custom-scrollbar" ref={bootRef}>
            {bootLines.map((line, i) => (
              <div key={i} className="boot-line">
                {'>'} {line}
              </div>
            ))}
            <div className="boot-line blink">_</div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="login-form fade-in">
            <div className="input-group">
              <label className="input-label">USER_ID:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                autoFocus
                placeholder="ENTER USERNAME..."
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">ACCESS_KEY:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="ENTER PASSWORD..."
              />
            </div>

            {error && (
              <div className="error-msg">
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading || !businessId}>
              {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
            </button>
          </form>
        )}

        {!businessId && showForm && (
          <div className="mt-4 text-center text-sm opacity-50">
            WAITING FOR TERMINAL CONNECTION...
          </div>
        )}
        
        <div className="dev-credit">
          ZETA SYSTEMS INC. © 1970
        </div>
      </div>
    </div>
  );
};

export default Login;
