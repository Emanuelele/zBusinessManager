import React, { useState, useEffect } from 'react';
import useNuiCallback from '../hooks/useNuiCallback';
import styles from './Cleaning.module.css';
import { useNotification } from '../context/NotificationContext';
export default function Cleaning({ businessId }) {
  const callback = useNuiCallback();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
   const { addNotification } = useNotification();

  const fetchUpgrades = async () => {
    try {
      const result = await callback('zBusinessManager:server:getCleaningUpgrades', businessId);
      if (result && result.success && result.data) {
        setData(result.data);
      } else {
        setError('FAILED TO RETRIEVE SYSTEM DATA');
      }
    } catch (err) {
      setError('CONNECTION ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) fetchUpgrades();
    else { setError('NO BUSINESS ID'); setLoading(false); }
    
    // Debounce dirt sync updates to prevent excessive re-renders
    let dirtSyncTimeout = null;
    const handleDirtSync = (event) => {
        if (event.data.action === 'zBusinessManager:syncDirt' && event.data.businessKey === businessId) {
            // Clear existing timeout
            if (dirtSyncTimeout) clearTimeout(dirtSyncTimeout);
            
            // Set new timeout to batch updates
            dirtSyncTimeout = setTimeout(() => {
                fetchUpgrades();
            }, 500); // Wait 500ms after last dirt sync before updating
        }
    };
    window.addEventListener('message', handleDirtSync);
    return () => {
        window.removeEventListener('message', handleDirtSync);
        if (dirtSyncTimeout) clearTimeout(dirtSyncTimeout);
    };
  }, [businessId, callback]);

  const handleBuyUpgrade = async (type) => {
    //addNotification('success', `> PROCESSING: ${type}...`);
    try {
      const result = await callback('zBusinessManager:server:buyCleaningUpgrade', businessId, type);
      if (result.success) {
        addNotification('success', `> SUCCESS: ${result.data}`);
        fetchUpgrades();
      } else {
        addNotification('error', `> ERROR: ${result.data}`);
      }
    } catch (error) {
      addNotification('error', `> SYSTEM FAILURE`);
    }
    //setTimeout(() => addNotification('error', `> SYSTEM FAILURE`), 3000);
  };

  if (loading) return <div className={styles.container}>INITIALIZING...</div>;
  if (error) return <div className={styles.container} style={{color: 'red'}}>{error}</div>;
  if (!data) return null;

  const { levels, config, stats } = data;
  
  // Stats calculation
  const capacityLevel = levels.capacity || 1;
  const maxDirt = config.capacity.levels[capacityLevel - 1]?.value || 100;
  const currentDirt = stats.current;
  const dirtPercentage = Math.min(100, Math.round((currentDirt / maxDirt) * 100));
  
  // Status logic
  let statusClass = styles.statusOptimal;
  let statusText = 'OPTIMAL';
  let blockStatusClass = 'optimal';
  
  if (dirtPercentage > 80) {
    statusClass = styles.statusCritical;
    statusText = 'CRITICAL';
    blockStatusClass = 'critical';
  } else if (dirtPercentage > 50) {
    statusClass = styles.statusWarning;
    statusText = 'WARNING';
    blockStatusClass = 'warning';
  }

  // Block Progress Bar Logic
  const totalBlocks = 20;
  const filledBlocks = Math.ceil((dirtPercentage / 100) * totalBlocks);

  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>SANITATION_CTRL</h1>
          <div className={styles.subtitle}>MAINTENANCE PROTOCOL V2.1</div>
        </div>
        <div className={styles.status}>
            <div className={styles.statusLabel}>STATUS</div>
            <div className={`${styles.statusValue} ${statusClass}`}>{statusText}</div>
        </div>
      </div>

      {/* MONITOR SECTION */}
      <div className={styles.monitor}>
        <div className={styles.monitorHeader}>
            <span>LIVELLO SPORCIZIA</span>
            <span>{currentDirt} / {maxDirt} ({dirtPercentage}%)</span>
        </div>
        
        {/* BLOCK PROGRESS BAR */}
        <div className={styles.progressBar}>
            {[...Array(totalBlocks)].map((_, i) => (
                <div 
                    key={i} 
                    className={`${styles.progressBlock} ${i < filledBlocks ? styles.blockFilled + ' ' + styles[blockStatusClass] : ''}`}
                />
            ))}
        </div>
      </div>

      {/* MESSAGE AREA */}
      {/* <div className={styles.messageArea}>
        {message && <span className={styles.message}>{message}</span>}
      </div> */}

      {/* UPGRADES GRID */}
      <div className={styles.upgradesGrid}>
        {Object.entries(config).map(([key, data]) => {
            const currentLevel = levels[key] || 1;
            // Lua sends 1-based levels, but JSON array is 0-based
            // Level 1 is at index 0, Level 5 is at index 4
            const currentLevelData = data.levels[currentLevel - 1];
            const nextLevelData = data.levels[currentLevel]; // This is index for next level (e.g. if level 1, we want index 1 for level 2)
            const isMaxed = !nextLevelData;

            return (
                <div key={key} className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>{data.label}</h3>
                        <span className={styles.cardLevel}>LVL {currentLevel}</span>
                    </div>
                    
                    <p className={styles.cardDesc}>{data.description}</p>
                    
                    <div style={{ marginTop: 'auto' }}>
                        <div className={styles.statsRow}>
                            <span className={styles.statLabel} style={{ color: '#fff' }}>CURRENT:</span>
                            <span className={styles.statValue}>
                                {key === 'efficiency' 
                                    ? `${Math.round(currentLevelData?.value * 100)}% time, ${currentLevelData?.count} prop${currentLevelData?.count > 1 ? 's' : ''}`
                                    : currentLevelData?.value}
                            </span>
                        </div>
                        
                        {!isMaxed && (
                            <div className={styles.statsRow} style={{ borderColor: 'rgba(255,176,0,0.3)' }}>
                                <span className={styles.statLabel}>UPGRADE:</span>
                                <span className={styles.upgradeValue}>
                                    {key === 'efficiency'
                                        ? `${Math.round(nextLevelData?.value * 100)}% time, ${nextLevelData?.count} props`
                                        : nextLevelData?.value}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={() => handleBuyUpgrade(key)}
                            disabled={isMaxed}
                            className={styles.button}
                        >
                            {isMaxed ? 'MAXED OUT' : `INSTALL [$${nextLevelData?.cost}]`}
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
