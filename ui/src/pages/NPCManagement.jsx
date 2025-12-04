import { useState, useEffect, useRef } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './Crafting.css'; // Reuse crafting styles

export default function NPCManagement({ businessId }) {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [npcHired, setNpcHired] = useState(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadStats();
  }, [businessId]);

  const loadStats = async () => {
    try {
      const result = await fetchNui('zBusinessManager:server:getNPCStats', businessId);
      if (!mountedRef.current) return;
      
      if (result.success) {
        setStats(result.stats);
        setNpcHired(true);
      } else {
        // NPC not hired
        setNpcHired(false);
        setStats(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setNpcHired(false);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleHireNPC = async () => {
    try {
      const result = await fetchNui('zBusinessManager:server:hireCraftingNPC', businessId);
      if (result.success) {
        addNotification('success', 'NPC Assunto con successo!');
        loadStats();
      } else {
        addNotification('error', result.message || 'Failed to hire NPC');
      }
    } catch (e) {
      //console.error('Error hiring NPC:', e);
      addNotification('error', 'Error hiring NPC');
    }
  };

  const handleUpgrade = async () => {
    if (!stats || !stats.nextLevel) return;
    try {
      const result = await fetchNui('zBusinessManager:server:upgradeNPC', businessId);
      if (result.success) {
        addNotification('success', 'NPC Potenziato!');
        loadStats();
      } else {
        addNotification('error', result.message || 'Failed to upgrade NPC');
      }
    } catch (e) {
      //console.error('Error upgrading NPC:', e);
      addNotification('error', 'Errore durante upgrade');
    }
  };

  const handlePayWage = async () => {
    try {
      const result = await fetchNui('zBusinessManager:server:payNPCWage', businessId);
      if (result.success) {
        addNotification('success', 'Stipendio pagato!');
        loadStats();
      } else {
        addNotification('error', result.message || 'Failed to pay wage');
      }
    } catch (e) {
      //console.error('Error paying wage:', e);
      addNotification('error', 'Errore pagamento stipendio');
    }
  };

  if (loading) {
    return (
      <div className="crafting-page">
        <div className="crafting-header">
          <div className="crafting-title">
            <h2 className="glitch-text">NPC MANAGEMENT.EXE</h2>
            <p>V.1.0.0 // EMPLOYEE CONTROL MODULE</p>
          </div>
          <button 
            onClick={() => navigate('/crafting')}
            className="btn-stash blink-hover"
          >
            [ TORNA AL CRAFTING ]
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ color: 'var(--terminal-green)', fontSize: '2rem', animation: 'blink 1s infinite' }}>
            LOADING NPC DATA...
          </div>
        </div>
      </div>
    );
  }

  // NPC NOT HIRED
  if (!npcHired) {
    return (
      <div className="crafting-page">
        <div className="crafting-header">
          <div className="crafting-title">
            <h2 className="glitch-text">NPC MANAGEMENT.EXE</h2>
            <p>V.1.0.0 // EMPLOYEE CONTROL MODULE</p>
          </div>
          <button 
            onClick={() => navigate('/crafting')}
            className="btn-stash blink-hover"
          >
            [ TORNA AL CRAFTING ]
          </button>
        </div>
        <div className="crafting-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{
              border: '2px solid #eab308',
              padding: '3rem 2rem',
              background: 'rgba(234, 179, 8, 0.05)'
            }}>
              <h2 style={{ color: '#eab308', marginTop: 0, fontSize: '2rem' }}>
                NPC NON ASSUNTO
              </h2>
              <p style={{ color: 'var(--terminal-green)', fontSize: '1.2rem', marginBottom: '2rem' }}>
                Nessun NPC è stato assunto per questa attività di crafting.
                <br />
                Assumi un NPC per iniziare a produrre items.
              </p>
              <div style={{
                background: 'rgba(8, 234, 121, 0.1)',
                border: '1px solid var(--terminal-green)',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: 'var(--terminal-green)', marginTop: 0 }}>LIVELLO 1 - STATS INIZIALI</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#08ea79' }}>
                  <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(8, 234, 121, 0.2)' }}>
                    Velocità Craft: x1.0 (normale)
                  </li>
                  <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(8, 234, 121, 0.2)' }}>
                    Coda Massima: 3 items
                  </li>
                  <li style={{ padding: '0.5rem 0' }}>
                    Stipendio Settimanale: $500
                  </li>
                </ul>
              </div>
              <button 
                className="btn-craft"
                onClick={handleHireNPC}
                style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: '#eab308', color: '#eab308', fontSize: '1.5rem' }}
              >
                ASSUMI NPC (GRATIS)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUnpaid = (Date.now() / 1000 - stats.lastPaymentTime) > (7 * 24 * 60 * 60);

  return (
    <div className="crafting-page">
      {/* HEADER */}
      <div className="crafting-header">
        <div className="crafting-title">
          <h2 className="glitch-text">NPC MANAGEMENT.EXE</h2>
          <p>V.1.0.0 // EMPLOYEE CONTROL MODULE</p>
        </div>
        <button 
          onClick={() => navigate('/crafting')}
          className="btn-stash blink-hover"
        >
          [ TORNA AL CRAFTING ]
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="crafting-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '800px', width: '100%', padding: '2rem' }}>
          
          {/* NPC STATS */}
          <div className="npc-stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-item">
              <label style={{ color: '#08ea79', fontSize: '0.9rem', opacity: 0.7 }}>LIVELLO</label>
              <span style={{ color: 'var(--terminal-green)', fontSize: '2rem', fontWeight: 'bold' }}>{stats.level}</span>
            </div>
            <div className="stat-item">
              <label style={{ color: '#08ea79', fontSize: '0.9rem', opacity: 0.7 }}>VELOCITÀ</label>
              <span style={{ color: 'var(--terminal-green)', fontSize: '2rem', fontWeight: 'bold' }}>x{stats.craftSpeed}</span>
            </div>
            <div className="stat-item">
              <label style={{ color: '#08ea79', fontSize: '0.9rem', opacity: 0.7 }}>CODA MAX</label>
              <span style={{ color: 'var(--terminal-green)', fontSize: '2rem', fontWeight: 'bold' }}>{stats.queueSize}</span>
            </div>
            <div className="stat-item">
              <label style={{ color: '#08ea79', fontSize: '0.9rem', opacity: 0.7 }}>STIPENDIO</label>
              <span style={{ 
                color: isUnpaid ? '#ff4444' : 'var(--terminal-green)', 
                fontSize: '2rem', 
                fontWeight: 'bold',
                animation: isUnpaid ? 'blink 1s infinite' : 'none'
              }}>
                ${stats.wage}/sett
              </span>
            </div>
          </div>

          {/* STATUS */}
          <div style={{
            margin: '2rem 0',
            padding: '1rem',
            border: '2px solid #08ea79',
            background: 'rgba(8, 234, 121, 0.1)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <label style={{ color: '#08ea79', fontWeight: 'bold' }}>STATO:</label>
            {isUnpaid ? (
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff4444', animation: 'blink 1s infinite' }}>
                SCIOPERO (NON PAGATO)
              </span>
            ) : (
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--terminal-green)' }}>
                ATTIVO
              </span>
            )}
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isUnpaid && (
              <button 
                className="btn-craft"
                onClick={handlePayWage}
                style={{ background: 'rgba(255, 68, 68, 0.1)', borderColor: '#ff4444', color: '#ff4444' }}
              >
                PAGA STIPENDIO (${stats.wage})
              </button>
            )}

            {stats.nextLevel ? (
              <div style={{
                border: '2px solid #eab308',
                padding: '1.5rem',
                background: 'rgba(234, 179, 8, 0.05)'
              }}>
                <h3 style={{ color: '#eab308', marginTop: 0, marginBottom: '1rem' }}>
                  PROSSIMO LIVELLO (${stats.nextLevel.cost})
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '1rem 0',
                  color: 'var(--terminal-green)'
                }}>
                  <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(8, 234, 121, 0.2)' }}>
                    Velocità: x{stats.nextLevel.craftSpeed}
                  </li>
                  <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(8, 234, 121, 0.2)' }}>
                    Coda: {stats.nextLevel.queueSize}
                  </li>
                  <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(8, 234, 121, 0.2)' }}>
                    Nuovo Stipendio: ${stats.nextLevel.wage}
                  </li>
                </ul>
                <button 
                  className="btn-craft"
                  onClick={handleUpgrade}
                  style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: '#eab308', color: '#eab308' }}
                >
                  UPGRADE NPC
                </button>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#eab308',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                border: '2px solid #eab308',
                background: 'rgba(234, 179, 8, 0.1)'
              }}>
                LIVELLO MASSIMO RAGGIUNTO
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
