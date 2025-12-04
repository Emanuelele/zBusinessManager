import { useState, useEffect } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { useNotification } from '../context/NotificationContext';
import styles from './Payroll.module.css';

export default function Payroll({ businessId }) {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('issue'); // 'issue' | 'history'
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    amount: '',
    document: ''
  });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await fetchNui('zBusinessManager:server:payroll:getPayslips', businessId);
      if (result.success) {
        setPayslips(result.payslips);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, businessId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await fetchNui('zBusinessManager:server:payroll:printPayslip', {
        businessId,
        ...formData
      });
      
      if (result.success) {
        addNotification('success', result.message);
        setFormData({ name: '', surname: '', amount: '', document: '' });
      } else {
        addNotification('error', result.message);
      }
    } catch (e) {
      console.error(e);
      addNotification('error', 'Errore di comunicazione');
    }
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

  const handleRevoke = (payslipId) => {
    setConfirmModal({
      isOpen: true,
      message: 'REVOCARE QUESTO CEDOLINO?',
      onConfirm: async () => {
        try {
          const result = await fetchNui('zBusinessManager:server:payroll:revokePayslip', payslipId);
          if (result.success) {
            addNotification('success', result.message);
            loadHistory();
          } else {
            addNotification('error', result.message);
          }
        } catch (e) {
          console.error(e);
          addNotification('error', 'Errore revoca');
        }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>GESTIONE STIPENDI</h2>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'issue' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            EMETTI
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
          >
            STORICO
          </button>
        </div>
      </div>

      {activeTab === 'issue' && (
        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.group}>
              <label>NOME DIPENDENTE</label>
              <input 
                className={styles.input}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className={styles.group}>
              <label>COGNOME DIPENDENTE</label>
              <input 
                className={styles.input}
                value={formData.surname}
                onChange={e => setFormData({...formData, surname: e.target.value})}
                required
              />
            </div>

            <div className={styles.group}>
              <label>IMPORTO ($)</label>
              <input 
                type="number"
                className={styles.input}
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>

            <div className={styles.group}>
              <label>NUMERO DOCUMENTO</label>
              <input 
                className={styles.input}
                value={formData.document}
                onChange={e => setFormData({...formData, document: e.target.value})}
                required
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>
                STAMPA CEDOLINO
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>BENEFICIARIO</th>
                <th>IMPORTO</th>
                <th>DATA</th>
                <th>STATO</th>
                <th>AZIONI</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map(row => (
                <tr key={row.id} className={row.status === 'revoked' ? styles.revokedRow : ''}>
                  <td title={row.id}>{row.id.split('-').pop()}</td>
                  <td>{row.beneficiary}</td>
                  <td>${row.amount}</td>
                  <td>{new Date(row.created_at * 1000).toLocaleDateString('it-IT')}</td>
                  <td>
                    <span className={styles[`status_${row.status}`]}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {row.status === 'active' && (
                      <button onClick={() => handleRevoke(row.id)} className={styles.revokeBtn}>
                        REVOCA
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.empty}>NESSUN CEDOLINO TROVATO</td>
                </tr>
              )}
            </tbody>
          </table>
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
