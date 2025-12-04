import { useState, useEffect } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { useNotification } from '../context/NotificationContext';
import styles from './Cardealer.module.css';

export default function Cardealer({ businessId }) {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesOfDay, setVehiclesOfDay] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchNui('cardealer:getVehiclesOfDay');
      
      if (result) {
        setVehicles(result.vehicles || []);
        setCategories(result.categories || []);
        setVehiclesOfDay(result.vehiclesOfDay || []);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      addNotification('error', 'ERRORE CARICAMENTO DATI');
    } finally {
      setLoading(false);
    }
  };

  const handleBookVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      const result = await fetchNui('cardealer:bookVehicle', {
        vehicleModel: selectedVehicle.name,
        price: selectedVehicle.price
      });

      if (result.success) {
        addNotification('success', result.message);
        setConfirmModal(false);
        setSelectedVehicle(null);
      } else {
        addNotification('error', result.message);
      }
    } catch (error) {
      console.error('Failed to book vehicle:', error);
      addNotification('error', 'ERRORE PRENOTAZIONE');
    }
  };

  const availableVehicles = vehicles.filter(v => 
    vehiclesOfDay.includes(v.id) && 
    (selectedCategory === 0 || v.categoria === selectedCategory)
  );

  availableVehicles.sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>INIZIALIZZAZIONE SISTEMA...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>CARDEALER.EXE</h1>
          <p className={styles.subtitle}>SISTEMA VENDITA VEICOLI v1.0</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>DISPONIBILI OGGI</span>
            <span className={styles.statValue}>{vehiclesOfDay.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.categories}>
        <button
          className={`${styles.categoryBtn} ${selectedCategory === 0 ? styles.active : ''}`}
          onClick={() => setSelectedCategory(0)}
        >
          TUTTI ({availableVehicles.length})
        </button>
        {categories.map(cat => {
          const count = vehicles.filter(v => 
            vehiclesOfDay.includes(v.id) && v.categoria === cat.id
          ).length;
          
          return (
            <button
              key={cat.id}
              className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      <div className={styles.vehicleGrid}>
        {availableVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            className={`${styles.vehicleCard} ${selectedVehicle?.id === vehicle.id ? styles.selected : ''}`}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <div className={styles.vehicleHeader}>
              <span className={styles.vehicleName}>{vehicle.name.toUpperCase()}</span>
              <span className={styles.vehicleCategory}>
                {categories.find(c => c.id === vehicle.categoria)?.name || 'N/A'}
              </span>
            </div>
            <div className={styles.vehiclePrice}>${vehicle.price}</div>
            <div className={styles.vehicleActions}>
              <button
                className={styles.bookBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVehicle(vehicle);
                  setConfirmModal(true);
                }}
              >
                PRENOTA
              </button>
            </div>
          </div>
        ))}

        {availableVehicles.length === 0 && (
          <div className={styles.emptyState}>
            NESSUN VEICOLO DISPONIBILE IN QUESTA CATEGORIA
          </div>
        )}
      </div>

      {confirmModal && selectedVehicle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>CONFERMA PRENOTAZIONE</h3>
            <div className={styles.modalContent}>
              <div className={styles.modalRow}>
                <span>MODELLO:</span>
                <span>{selectedVehicle.name.toUpperCase()}</span>
              </div>
              <div className={styles.modalRow}>
                <span>CATEGORIA:</span>
                <span>{categories.find(c => c.id === selectedVehicle.categoria)?.name}</span>
              </div>
              <div className={styles.modalRow}>
                <span>PREZZO:</span>
                <span className={styles.priceHighlight}>${selectedVehicle.price}</span>
              </div>
              <div className={styles.modalInfo}>
                IL RITIRO SARÀ DISPONIBILE TRA 1 ORA
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setConfirmModal(false);
                  setSelectedVehicle(null);
                }}
              >
                ANNULLA
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleBookVehicle}
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