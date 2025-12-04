import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useNuiCallback from '../hooks/useNuiCallback';
import { useModules } from '../contexts/ModuleContext';
import './TerminalLayout.css';

// ASCII Icon mapping for modules
const asciiIconMap = {
  home: '[H]',
  crafting: '[#]',
  cleaning: '[%]',
  income: '[$]',
  orders: '[=]',
  npc: '[@]',
  payroll: '[P]',
  safe_registry: '[S]'
};

export default function TerminalLayout({ businessId, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const callback = useNuiCallback();
  const { unlockedModules, loadedModules } = useModules();
  const [allModules, setAllModules] = useState([]);
  
  // Load all available modules
  useEffect(() => {
    const loadModules = async () => {
      try {
        const result = await callback('zBusinessManager:server:getEnabledModules', businessId);
        if (result.success) {
          setAllModules(result.modules);
        }
      } catch (error) {
        console.error('Failed to load modules:', error);
      }
    };

    if (businessId) {
      loadModules();
    }
  }, [businessId, callback]);
  
  // Build menu items: HOME + unlocked AND loaded modules
  const menuItems = [
    { id: 'home', icon: asciiIconMap.home, label: 'HOME', path: '/home' },
    ...allModules
      .filter(module => loadedModules.has(module.id)) // Only show loaded modules
      .map(module => ({
        id: module.id,
        icon: asciiIconMap[module.id] || '[?]',
        label: module.label.replace('.EXE', ''),
        path: `/${module.id}`
      }))
  ];

  return (
    <div className="terminal-layout">

      {/* Sidebar */}
      <aside className="terminal-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">BUSINESS TERMINAL</h1>
          <p className="sidebar-subtitle">v2.1 SECURE</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-ascii">{isActive ? '>' : ' '} {item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>


      </aside>

      {/* Main Area */}
      <main className="terminal-main">

        {/* Top bar */}
        <header className="main-header">
          <div className="header-info">
            <span>SESSION: #4891</span>
            <span className="status-dot">●</span>
          </div>
          <div className="system-status">SYSTEM OPERATIONAL</div>
        </header>

        {/* Content */}
        <div className="content-wrapper">
          {children}
        </div>

        {/* Footer */}
        <footer className="main-footer">
          © 1970 Zeta Corp. All rights reserved.
        </footer>

      </main>
    </div>
  );
}

