import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNuiCallback from '../hooks/useNuiCallback';
import PasswordModal from '../components/PasswordModal';
import { useModules } from '../contexts/ModuleContext';
import styles from './Home.module.css';

export default function Home({ businessId }) {
  const navigate = useNavigate();
  const callback = useNuiCallback();
  const { unlockModule, isModuleUnlocked, loadModule } = useModules();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [insertingModuleId, setInsertingModuleId] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const result = await callback('zBusinessManager:server:getEnabledModules', businessId);
        if (result.success) {
          setModules(result.modules);
        }
      } catch (error) {
        console.error('Failed to fetch modules:', error);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchModules();
    }
  }, [businessId, callback]);

  const handleModuleClick = (module) => {
    if (module.requiresPassword && !isModuleUnlocked(module.id)) {
      setSelectedModule(module);
      setShowPasswordModal(true);
    } else {
      triggerInsertion(module.id);
    }
  };

  const triggerInsertion = (moduleId) => {
    setInsertingModuleId(moduleId);
    loadModule(moduleId); // Mark module as loaded for sidebar
    // Wait for animation to finish before navigating
    setTimeout(() => {
        navigate(`/${moduleId}`);
    }, 800);
  };

  const handlePasswordSubmit = async (password) => {
    try {
      const result = await callback('zBusinessManager:server:verifyModulePassword', businessId, selectedModule.id, password);
      
      if (result.success) {
        unlockModule(selectedModule.id);
        setShowPasswordModal(false);
        triggerInsertion(selectedModule.id);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-pulse">LOADING MODULES...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{'>'} BUSINESS MODULES</div>
      </div>
      
      <div className={styles.grid}>
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => handleModuleClick(module)}
            className={`${styles.floppyContainer} ${insertingModuleId === module.id ? styles.inserting : ''}`}
            disabled={!!insertingModuleId}
          >
            <div className={styles.floppyBody}>
                {/* Shutter */}
                <div className={styles.shutter}>
                    <div className={styles.shutterWindow}></div>
                </div>

                {/* Label */}
                <div className={styles.label}>
                    <div className={styles.labelText}>{module.label}</div>
                    <div className={styles.labelSubtext}>
                        IDX: {module.id.toUpperCase()}<br/>
                        VER: 1.0.4
                    </div>
                </div>

                {/* Write Protect Notch */}
                <div className={styles.notch}></div>

                {/* Arrow */}
                <div className={styles.arrow}>▼</div>
            </div>

            {/* Security LED */}
            {module.requiresPassword && (
              <div className={`${styles.led} ${isModuleUnlocked(module.id) ? styles.ledUnlocked : styles.ledLocked}`}></div>
            )}
          </button>
          
        ))}


      </div>
      
      <div className={styles.footer}>
        {insertingModuleId ? 'INSERTING DISK...' : '> INSERIRE FLOPPY DISK PER AVVIARE MODULO'}
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        moduleName={selectedModule?.label || ''}
      />
    </div>
  );
}
