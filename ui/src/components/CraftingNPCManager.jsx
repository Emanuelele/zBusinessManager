import React, { useState, useEffect } from 'react';
import { fetchNui } from '../utils/fetchNui';
import '../pages/Crafting.css'; // Reuse crafting styles

const CraftingNPCManager = ({ businessId, onClose, onUpdate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [businessId]);

  const loadStats = async () => {
    try {
      const result = await fetchNui('zBusinessManager:server:getNPCStats', businessId);
      if (result.success) {
        setStats(result.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!stats || !stats.nextLevel) return;
    try {
      const result = await fetchNui('zBusinessManager:server:upgradeNPC', businessId);
      if (result.success) {
        loadStats();
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayWage = async () => {
    try {
      const result = await fetchNui('zBusinessManager:server:payNPCWage', businessId);
      if (result.success) {
        loadStats();
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="npc-manager-loading">Loading...</div>;

  if (!stats) return <div className="npc-manager-error">Failed to load NPC stats</div>;

  const isUnpaid = (Date.now() / 1000 - stats.lastPaymentTime) > (7 * 24 * 60 * 60);

  return (
    <div className="npc-manager-overlay">
      <div className="npc-manager-content terminal-border">
        <div className="npc-header">
          <h2>GESTIONE NPC CRAFTING</h2>
          <button onClick={onClose} className="close-btn">X</button>
        </div>

        <div className="npc-stats-grid">
          <div className="stat-item">
            <label>LIVELLO</label>
            <span>{stats.level}</span>
          </div>
          <div className="stat-item">
            <label>VELOCITÀ</label>
            <span>x{stats.craftSpeed}</span>
          </div>
          <div className="stat-item">
            <label>CODA MAX</label>
            <span>{stats.queueSize}</span>
          </div>
          <div className="stat-item">
            <label>STIPENDIO</label>
            <span className={isUnpaid ? 'text-red blink' : 'text-green'}>
              ${stats.wage}/sett
            </span>
          </div>
        </div>

        <div className="npc-status">
          <label>STATO:</label>
          {isUnpaid ? (
            <span className="status-strike text-red blink">SCIOPERO (NON PAGATO)</span>
          ) : (
            <span className="status-active text-green">ATTIVO</span>
          )}
        </div>

        <div className="npc-actions">
          {isUnpaid && (
            <button className="terminal-btn action-btn" onClick={handlePayWage}>
              PAGA STIPENDIO (${stats.wage})
            </button>
          )}

          {stats.nextLevel ? (
            <div className="upgrade-section">
              <h3>PROSSIMO LIVELLO ({stats.nextLevel.cost}$)</h3>
              <ul>
                <li>Velocità: x{stats.nextLevel.craftSpeed}</li>
                <li>Coda: {stats.nextLevel.queueSize}</li>
                <li>Nuovo Stipendio: ${stats.nextLevel.wage}</li>
              </ul>
              <button className="terminal-btn upgrade-btn" onClick={handleUpgrade}>
                UPGRADE
              </button>
            </div>
          ) : (
            <div className="max-level">LIVELLO MASSIMO RAGGIUNTO</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CraftingNPCManager;
