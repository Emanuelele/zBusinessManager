import React, { useState, useEffect } from 'react';
import useNuiCallback from '../hooks/useNuiCallback';
import styles from './Income.module.css';

export default function Income({ businessId }) {
  const callback = useNuiCallback();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const result = await callback('zBusinessManager:server:getIncomeStats', businessId);
      if (result && result.success && result.stats) {
        setData(result.stats);
      } else {
        setError('FAILED TO RETRIEVE INCOME DATA');
      }
    } catch (err) {
      setError('CONNECTION ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) fetchStats();
    else { setError('NO BUSINESS ID'); setLoading(false); }
  }, [businessId, callback]);

  const handleCollect = async () => {
    setMessage('> PROCESSING COLLECTION...');
    try {
      const result = await callback('zBusinessManager:server:collectIncome', businessId);
      if (result.success) {
        setMessage(`> SUCCESS: ${result.message}`);
        fetchStats();
      } else {
        setMessage(`> ERROR: ${result.message}`);
      }
    } catch (error) {
      setMessage('> SYSTEM FAILURE');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBuyUpgrade = async (type) => {
    setMessage(`> PROCESSING: ${type}...`);
    try {
      const result = await callback('zBusinessManager:server:buyIncomeUpgrade', businessId, type);
      if (result.success) {
        setMessage(`> SUCCESS: ${result.message}`);
        fetchStats();
      } else {
        setMessage(`> ERROR: ${result.message}`);
      }
    } catch (error) {
      setMessage('> SYSTEM FAILURE');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className={styles.container}>INITIALIZING...</div>;
  if (error) return <div className={styles.container} style={{color: 'red'}}>{error}</div>;
  if (!data) return null;

  const { balance, totalEarned, playerCount, levels, config } = data;

  // Calculate current income rate
  const minPlayersLevel = levels.minPlayers || 1;
  const maxCapLevel = levels.maxCap || 1;
  const rateLevel = levels.rate || 1;

  // Fix: Lua levels are 1-based, JS arrays are 0-based
  const minPlayers = config.minPlayers.levels[minPlayersLevel - 1]?.value || 0;
  const maxCap = config.maxCap.levels[maxCapLevel - 1]?.value || 0;
  const rate = config.rate.levels[rateLevel - 1]?.value || 0;

  const effectivePlayers = Math.min(playerCount, maxCap);
  const currentRate = playerCount >= minPlayers ? effectivePlayers * rate : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>INCOME.EXE</h1>
          <p className={styles.subtitle}>PASSIVE REVENUE SYSTEM v1.0</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>SALDO NON RISCOSSO</div>
          <div className={styles.statValue}>${balance}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTALE GUADAGNATO</div>
          <div className={styles.statValue}>${totalEarned}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>CLIENTI ATTIVI</div>
          <div className={styles.statValue}>{playerCount}/{maxCap}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TARIFFA ATTUALE</div>
          <div className={styles.statValue}>${currentRate}/min</div>
        </div>
      </div>

      {/* Detailed Info Section */}
      <div className={styles.infoSection}>
        <h2 className={styles.infoTitle}>PARAMETRI GENERAZIONE INTROITI</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>INTERVALLO GENERAZIONE:</span>
            <span className={styles.infoValue}>1 MINUTO</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>GIOCATORI RICHIESTI (MIN):</span>
            <span className={styles.infoValue}>{minPlayers}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>CAPACITÀ MASSIMA (CAP):</span>
            <span className={styles.infoValue}>{maxCap}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>TARIFFA PER GIOCATORE:</span>
            <span className={styles.infoValue}>${rate}/min</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>GIOCATORI EFFETTIVI:</span>
            <span className={styles.infoValue}>{effectivePlayers}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>STATO GENERAZIONE:</span>
            <span className={playerCount >= minPlayers ? styles.infoValue : `${styles.infoValue} ${styles.warning}`}>
              {playerCount >= minPlayers ? 'ATTIVO' : `INATTIVO (Servono ${minPlayers - playerCount} giocatori)`}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>PROSSIMO GUADAGNO:</span>
            <span className={styles.infoValue}>${currentRate}</span>
          </div>
        </div>
      </div>

      {/* Collect Button */}
      <button 
        className={styles.collectButton}
        onClick={handleCollect}
        disabled={balance <= 0}
      >
        {balance > 0 ? `[ RISCUOTI $${balance} ]` : '[ NESSUN INTROITO ]'}
      </button>

      {/* Message */}
      {message && <div className={styles.message}>{message}</div>}

      {/* Upgrades */}
      <div className={styles.upgradesSection}>
        <h2 className={styles.sectionTitle}>UPGRADE DISPONIBILI</h2>
        
        <div className={styles.upgradesGrid}>
          {Object.keys(config).map(upgradeType => {
            const upgradeConfig = config[upgradeType];
            const currentLevel = levels[upgradeType] || 1;
            
            // Fix: Lua arrays (1-based) become JS arrays (0-based)
            // Level 1 is at index 0
            const currentData = upgradeConfig.levels[currentLevel - 1];
            const nextLevelData = upgradeConfig.levels[currentLevel]; // Index for next level is currentLevel (e.g. if lvl 1, index 1 is lvl 2)
            
            const maxLevel = Object.keys(upgradeConfig.levels).length;
            const isMaxLevel = !nextLevelData;
            const nextLevelCost = nextLevelData?.cost;

            const formatValue = (type, val) => {
                if (type === 'rate') return `$${val}/min`;
                if (type === 'minPlayers' || type === 'maxCap') return `${val} Players`;
                return val;
            };

            return (
              <div key={upgradeType} className={styles.upgradeCard}>
                <div className={styles.upgradeHeader}>
                  <h3 className={styles.upgradeTitle}>{upgradeConfig.label}</h3>
                  <span className={styles.upgradeLevel}>LV. {currentLevel}/{maxLevel}</span>
                </div>
                <p className={styles.upgradeDesc}>{upgradeConfig.description}</p>
                
                <div className={styles.upgradeStats}>
                  <div className={styles.upgradeStat}>
                    <span>ATTUALE:</span>
                    <span className={styles.statHighlight}>{formatValue(upgradeType, currentData?.value)}</span>
                  </div>
                  {!isMaxLevel && (
                    <div className={styles.upgradeStat}>
                      <span>PROSSIMO:</span>
                      <span className={styles.statHighlight}>{formatValue(upgradeType, nextLevelData?.value)}</span>
                    </div>
                  )}
                </div>

                {isMaxLevel ? (
                  <div className={styles.maxLevel}>LIVELLO MASSIMO</div>
                ) : (
                  <button
                    className={styles.upgradeButton}
                    onClick={() => handleBuyUpgrade(upgradeType)}
                  >
                    UPGRADE (${nextLevelData?.cost})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
