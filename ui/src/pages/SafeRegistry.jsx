import { useState, useEffect } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { useNotification } from '../context/NotificationContext';
import styles from './SafeRegistry.module.css';

export default function SafeRegistry({ businessId }) {
  const { addNotification } = useNotification();
  const [registry, setRegistry] = useState([]);
  const [safeList, setSafeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Assign Form State
  const [assignData, setAssignData] = useState({
    safeId: '',
    ownerName: '',
    ownerDoc: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchNui('zBusinessManager:server:bank:getSafeRegistry', businessId);
      if (result.success) {
        setRegistry(result.registry);
        setSafeList(result.safeList || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const result = await fetchNui('zBusinessManager:server:bank:assignSafe', {
        businessId,
        ...assignData
      });
      if (result.success) {
        addNotification('success', result.message);
        setShowAssignModal(false);
        setAssignData({ safeId: '', ownerName: '', ownerDoc: '' });
        loadData();
      } else {
        addNotification('error', result.message);
      }
    } catch (e) {
      console.error(e);
      addNotification('error', 'Errore durante l\'assegnazione');
    }
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

  const handleRevoke = (safeId) => {
    setConfirmModal({
      isOpen: true,
      message: 'SEI SICURO DI VOLER REVOCARE QUESTA CASSETTA?',
      onConfirm: async () => {
        try {
          const result = await fetchNui('zBusinessManager:server:bank:revokeSafe', safeId);
          if (result.success) {
            addNotification('success', result.message);
            loadData();
          } else {
            addNotification('error', result.message);
          }
        } catch (e) { 
          console.error(e);
          addNotification('error', 'Errore durante la revoca');
        }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const handleRenew = async (safeId) => {
    try {
      const result = await fetchNui('zBusinessManager:server:bank:renewSafe', safeId);
      if (result.success) loadData();
    } catch (e) { console.error(e); }
  };

  // Filter registry
  const filteredRegistry = registry.filter(row => 
    row.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.owner_doc.includes(searchTerm) ||
    row.safe_id.includes(searchTerm)
  );

  // Filter available safes for dropdown
  const availableSafes = safeList.filter(safe => 
    !registry.find(r => r.safe_id === safe.id)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>REGISTRO CASSETTE DI SICUREZZA</h2>
        <button onClick={() => setShowAssignModal(true)} className={styles.addBtn}>
          [ + ASSEGNA NUOVA ]
        </button>
      </div>

      <div className={styles.searchBar}>
        <input 
          placeholder="CERCA PER NOME, DOCUMENTO O ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID CASSETTA</th>
              <th>INTESTATARIO</th>
              <th>DOCUMENTO</th>
              <th>ASSEGNATO IL</th>
              <th>SCADENZA</th>
              <th>STATO</th>
              <th>AZIONI</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistry.map(row => (
              <tr key={row.id} className={row.isExpired ? styles.expiredRow : ''}>
                <td>{safeList.find(s => s.id === row.safe_id)?.label || row.safe_id}</td>
                <td>{row.owner_name}</td>
                <td>{row.owner_doc}</td>
                <td>{new Date(row.assigned_at * 1000).toLocaleDateString('it-IT')}</td>
                <td>{new Date(row.expires_at * 1000).toLocaleDateString('it-IT')}</td>
                <td>
                  {row.isExpired ? (
                    <span className={styles.statusExpired}>SCADUTA</span>
                  ) : (
                    <span className={styles.statusActive}>ATTIVA</span>
                  )}
                </td>
                <td className={styles.actions}>
                  {row.isExpired && (
                    <button onClick={() => handleRenew(row.safe_id)} className={styles.renewBtn}>
                      RINNOVA
                    </button>
                  )}
                  <button onClick={() => handleRevoke(row.safe_id)} className={styles.revokeBtn}>
                    REVOCA
                  </button>
                </td>
              </tr>
            ))}
            {filteredRegistry.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.empty}>NESSUNA ASSEGNAZIONE TROVATA</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>ASSEGNAZIONE CASSETTA</h3>
            <form onSubmit={handleAssign}>
              <div className={styles.group}>
                <label>SELEZIONA CASSETTA</label>
                <div className={styles.customSelect}>
                  <div 
                    className={styles.selectTrigger} 
                    onClick={() => setAssignData(prev => ({ ...prev, showDropdown: !prev.showDropdown }))}
                  >
                    {availableSafes.find(s => s.id === assignData.safeId)?.label || "-- SELEZIONA --"}
                    <span className={styles.arrow}>▼</span>
                  </div>
                  
                  {assignData.showDropdown && (
                    <div className={styles.selectOptions}>
                      {availableSafes.map(safe => (
                        <div 
                          key={safe.id} 
                          className={styles.option}
                          onClick={() => setAssignData(prev => ({ ...prev, safeId: safe.id, showDropdown: false }))}
                        >
                          {safe.label}
                        </div>
                      ))}
                      {availableSafes.length === 0 && (
                        <div className={styles.option} style={{ opacity: 0.5 }}>NESSUNA CASSETTA DISPONIBILE</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.group}>
                <label>NOME E COGNOME</label>
                <input 
                  value={assignData.ownerName}
                  onChange={e => setAssignData({...assignData, ownerName: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.group}>
                <label>NUMERO DOCUMENTO</label>
                <input 
                  value={assignData.ownerDoc}
                  onChange={e => setAssignData({...assignData, ownerDoc: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAssignModal(false)} className={styles.cancelBtn}>ANNULLA</button>
                <button type="submit" className={styles.confirmBtn}>CONFERMA</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ width: '350px', textAlign: 'center' }}>
            <h3 style={{ color: '#ef4444', borderColor: '#ef4444' }}>ATTENZIONE</h3>
            <p>{confirmModal.message}</p>
            <div className={styles.modalActions} style={{ justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })} 
                className={styles.cancelBtn}
              >
                ANNULLA
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className={styles.confirmBtn}
                style={{ background: '#ef4444', color: 'white' }}
              >
                CONFERMA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
