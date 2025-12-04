import React, { useState, useEffect, useRef } from 'react';
import styles from './Sheriff.module.css';
import { fetchNui } from '../utils/fetchNui';
import { useNotification } from '../context/NotificationContext';

const Sheriff = () => {
    const { addNotification } = useNotification();
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [activeTab, setActiveTab] = useState('crimes'); // crimes, fines, notes, complaints
    const [mainView, setMainView] = useState('citizens'); // citizens, vehicles, anklets, unpaid_fines, expired_fines
    
    const [vehicles, setVehicles] = useState([]);
    const [vehicleQuery, setVehicleQuery] = useState('');
    const [searchedVehicle, setSearchedVehicle] = useState(null);

    const [anklets, setAnklets] = useState([]);
    const [globalFines, setGlobalFines] = useState([]);

    const [showModal, setShowModal] = useState(null); // 'crime', 'fine', 'note', 'complaint'
    const [modalAmount, setModalAmount] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isTracking, setIsTracking] = useState(false);
    const [trackingLogs, setTrackingLogs] = useState([]);
    const [hexDump, setHexDump] = useState([]);
    const [trackingProgress, setTrackingProgress] = useState(0);

    const textRef = useRef(null);

    // Sync selectedPlayer with players list updates to refresh UI
    useEffect(() => {
        if (selectedPlayer && players.length > 0) {
            const updated = players.find(p => p.identifier === selectedPlayer.identifier);
            if (updated) {
                setSelectedPlayer(updated);
            }
        }
    }, [players]);

    // Fetch players when search query changes (debounced or min length)
    useEffect(() => {
        if (mainView === 'citizens') {
            if (searchQuery.length >= 4) {
                const timer = setTimeout(() => {
                    loadPlayers(searchQuery);
                }, 500);
                return () => clearTimeout(timer);
            } else {
                setPlayers([]);
            }
        }
    }, [searchQuery, mainView]);

    // Load other views data
    useEffect(() => {
        if (mainView === 'anklets') loadAnklets();
        if (mainView === 'unpaid_fines') loadGlobalFines('unpaid');
        if (mainView === 'expired_fines') loadGlobalFines('expired');
    }, [mainView]);

    const loadPlayers = async (query) => {
        setLoading(true);
        try {
            const data = await fetchNui('sheriff:getPlayersData', { query });
            setPlayers(data || []);
        } catch (error) {
            console.error('Failed to load players:', error);
            addNotification('error', 'ERRORE CARICAMENTO CITTADINI');
        } finally {
            setLoading(false);
        }
    };

    const generateHex = () => {
        let hex = '';
        const chars = '0123456789ABCDEF';
        for (let i = 0; i < 32; i++) {
            hex += chars[Math.floor(Math.random() * 16)];
            if (i % 2 === 1) hex += ' ';
        }
        return hex;
    };

    const simulateTracking = async (plate) => {
        setIsTracking(true);
        setTrackingProgress(0);
        setTrackingLogs([]);
        setHexDump([]);
        setSearchedVehicle(null);

        const logs = [
            "INIT_SEQ_2025... OK",
            "CONNECTING TO SAT_NET_V4...",
            "HANDSHAKE: ACKSENT [101010]",
            "BYPASSING FIREWALL [LAYER 7]...",
            "INJECTING PACKET STREAM...",
            "ACCESS GRANTED: ROOT LEVEL",
            `SEARCHING LPR_DB FOR [${plate}]...`,
            "MATCH FOUND: SECTOR 7G",
            "TRIANGULATING SIGNAL SOURCE...",
            "CALCULATING COORDINATES...",
            "DOWNLOADING TELEMETRY DATA...",
            "LOCKING TARGET SIGNAL...",
            "COMPLETE."
        ];

        // Fill hex dump initially
        const initialHex = [];
        for(let i=0; i<20; i++) initialHex.push(generateHex());
        setHexDump(initialHex);

        for (let i = 0; i < logs.length; i++) {
            // Update hex dump randomly
            setHexDump(prev => {
                const newHex = [...prev];
                newHex.shift();
                newHex.push(generateHex());
                return newHex;
            });

            setTrackingLogs(prev => [...prev, `> ${logs[i]}`]);
            setTrackingProgress(((i + 1) / logs.length) * 100);
            
            // Random delay for "processing" feel
            await new Promise(r => setTimeout(r, Math.random() * 1000 + 200));
        }

        await new Promise(r => setTimeout(r, 800));
        
        try {
            const result = await fetchNui('sheriff:searchVehicle', { plate });
            setSearchedVehicle(result);
        } catch (error) {
            console.error('Failed to search vehicle:', error);
            addNotification('error', 'ERRORE RICERCA VEICOLO');
        } finally {
            setIsTracking(false);
            setLoading(false);
        }
    };

    const renderProgressBar = (percent) => {
        const totalBars = 40;
        const filledBars = Math.floor((percent / 100) * totalBars);
        const emptyBars = totalBars - filledBars;
        return `[${'█'.repeat(filledBars)}${'.'.repeat(emptyBars)}] ${Math.floor(percent)}%`;
    };

    const handleVehicleSearch = async () => {
        if (isTracking || !vehicleQuery) return;
        simulateTracking(vehicleQuery);
    };

    const loadAnklets = async () => {
        setLoading(true);
        try {
            const data = await fetchNui('sheriff:getAnklets');
            const ankletList = Array.isArray(data) ? data : Object.entries(data).map(([k, v]) => ({ ...v, id: k }));
            setAnklets(ankletList);
        } catch (error) {
            console.error('Failed to load anklets:', error);
            addNotification('error', 'ERRORE CARICAMENTO CAVIGLIERE');
        } finally {
            setLoading(false);
        }
    };

    const loadGlobalFines = async (type) => {
        setLoading(true);
        try {
            const endpoint = type === 'unpaid' ? 'sheriff:getUnpaidFines' : 'sheriff:getExpiredFines';
            const data = await fetchNui(endpoint);
            setGlobalFines(data || []);
        } catch (error) {
            console.error('Failed to load fines:', error);
            addNotification('error', 'ERRORE CARICAMENTO MULTE');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRecord = async () => {
        const text = textRef.current ? textRef.current.value : '';
        if (!selectedPlayer || !text) return;

        try {
            let result;
            if (showModal === 'crime') {
                result = await fetchNui('sheriff:insertCrime', { identifier: selectedPlayer.identifier, record: text });
            } else if (showModal === 'note') {
                result = await fetchNui('sheriff:insertNote', { identifier: selectedPlayer.identifier, note: text });
            } else if (showModal === 'complaint') {
                result = await fetchNui('sheriff:insertComplaint', { identifier: selectedPlayer.identifier, complaint: text });
            } else if (showModal === 'fine') {
                result = await fetchNui('sheriff:insertFine', { 
                    identifier: selectedPlayer.identifier, 
                    amount: modalAmount, 
                    reason: text,
                    firstname: selectedPlayer.firstname,
                    lastname: selectedPlayer.lastname
                });
            }

            if (result && result.success) {
                setShowModal(null);
                setModalAmount('');
                if (textRef.current) textRef.current.value = '';
                loadPlayers(searchQuery); // Refresh data
                addNotification('success', 'RECORD AGGIUNTO CON SUCCESSO');
            } else {
                addNotification('error', 'ERRORE AGGIUNTA RECORD');
            }
        } catch (error) {
            console.error('Failed to add record:', error);
            addNotification('error', 'ERRORE DI SISTEMA');
        }
    };

    const handleDeleteRecord = async (type, id) => {
        try {
            let result;
            if (type === 'crime') result = await fetchNui('sheriff:deleteCrime', { crimeId: id });
            else if (type === 'note') result = await fetchNui('sheriff:deleteNote', { noteId: id });
            else if (type === 'complaint') result = await fetchNui('sheriff:deleteComplaint', { complaintId: id });
            else if (type === 'fine') result = await fetchNui('sheriff:deleteFine', { fineId: id });

            if (result && result.success) {
                loadPlayers(searchQuery);
                addNotification('success', 'RECORD ELIMINATO');
            } else {
                addNotification('error', 'ERRORE ELIMINAZIONE RECORD');
            }
        } catch (error) {
            console.error('Failed to delete record:', error);
            addNotification('error', 'ERRORE DI SISTEMA');
        }
    };

    const handleAnnouncement = async () => {
        try {
            await fetchNui('sheriff:toggleAnnouncement');
            addNotification('success', 'ALLARME INVIATO');
        } catch (error) {
            console.error('Failed to toggle announcement:', error);
            addNotification('error', 'ERRORE INVIO ALLARME');
        }
    };

    const handleTrack = async (ankletId, name) => {
        try {
            await fetchNui('sheriff:localizePlayer', { ankletId, name });
            addNotification('success', 'SEGNALE INVIATO AL GPS');
        } catch (error) {
            console.error('Failed to track:', error);
            addNotification('error', 'ERRORE TRACCIAMENTO');
        }
    };

    const handlePayFine = async (fineId) => {
        try {
            const result = await fetchNui('sheriff:flagFinePaid', { fineId });
            if (result && result.success) {
                if (mainView === 'citizens' && selectedPlayer) {
                    loadPlayers(searchQuery);
                } else if (mainView === 'unpaid_fines' || mainView === 'expired_fines') {
                    loadGlobalFines(mainView === 'unpaid_fines' ? 'unpaid' : 'expired');
                }
                addNotification('success', result.message || 'MULTA PAGATA');
            } else {
                console.error('Failed to pay fine:', result?.message);
                addNotification('error', result?.message || 'ERRORE PAGAMENTO');
            }
        } catch (error) {
            console.error('Failed to pay fine:', error);
            addNotification('error', 'ERRORE DI SISTEMA');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                        <div>
                          <h1 className={styles.title}>SHERIFF.EXE</h1>
                          <p className={styles.subtitle}>SHERIFF DATABASE v1.0</p>
                        </div>
                <div className={styles.actions}>
                    <button className={`${styles.actionButton} ${mainView === 'citizens' ? styles.active : ''}`} onClick={() => setMainView('citizens')}>CITTADINI</button>
                    <button className={`${styles.actionButton} ${mainView === 'vehicles' ? styles.active : ''}`} onClick={() => setMainView('vehicles')}>VEICOLI</button>
                    <button className={`${styles.actionButton} ${mainView === 'anklets' ? styles.active : ''}`} onClick={() => setMainView('anklets')}>CAVIGLIERE</button>
                    <button className={`${styles.actionButton} ${mainView === 'unpaid_fines' ? styles.active : ''}`} onClick={() => setMainView('unpaid_fines')}>MULTE</button>
                    <button className={styles.actionButton} onClick={handleAnnouncement}>🚨 ALLARME</button>
                </div>
            </div>

            {/* Tracking Overlay - RETRO MODE */}
            {isTracking && (
                <div className={styles.trackingOverlay}>
                    <div className={styles.trackingContainer}>
                        <div className={styles.trackingHeader}>
                            <span>TERMINAL_UPLINK_V2.0</span>
                            <span>STATUS: CONNECTED</span>
                        </div>
                        
                        <div className={styles.trackingBody}>
                            <div className={styles.hexColumn}>
                                {hexDump.map((hex, i) => (
                                    <div key={i}>{hex}</div>
                                ))}
                            </div>
                            <div className={styles.mainLog}>
                                {trackingLogs.map((log, index) => (
                                    <div key={index} className={styles.logLine}>{log}</div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.progressBarContainer}>
                            {renderProgressBar(trackingProgress)}
                        </div>
                    </div>
                </div>
            )}

            <div className={`${styles.content} ${mainView === 'citizens' ? styles.splitView : styles.fullView}`}>
                {/* CITIZENS VIEW */}
                {mainView === 'citizens' && (
                    <>
                        <div className={styles.searchPanel}>
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="CERCA CITTADINO (MIN 4 CARATTERI)..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className={styles.citizenList}>
                                {loading && <div className={styles.emptyState}>CARICAMENTO...</div>}
                                {!loading && players.length === 0 && searchQuery.length >= 4 && <div className={styles.emptyState}>NESSUN RISULTATO</div>}
                                {players.map(player => (
                                    <div 
                                        key={player.identifier} 
                                        className={`${styles.citizenItem} ${selectedPlayer?.identifier === player.identifier ? styles.selected : ''}`}
                                        onClick={() => setSelectedPlayer(player)}
                                    >
                                        <span>{player.firstname} {player.lastname}</span>
                                        <span>{player.date_of_birth}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.detailsPanel}>
                            {selectedPlayer ? (
                                <>
                                    <div className={styles.citizenHeader}>
                                        <div className={styles.citizenName}>{selectedPlayer.firstname} {selectedPlayer.lastname}</div>
                                        <div className={styles.citizenInfo}>
                                            <div>DOB: {selectedPlayer.date_of_birth}</div>
                                            <div>SEX: {selectedPlayer.gender}</div>
                                            <div>HEIGHT: {selectedPlayer.height}cm</div>
                                            <div>PHONE: {selectedPlayer.phone_number || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div className={styles.tabs}>
                                        <div className={`${styles.tab} ${activeTab === 'crimes' ? styles.active : ''}`} onClick={() => setActiveTab('crimes')}>CRIMINI</div>
                                        <div className={`${styles.tab} ${activeTab === 'fines' ? styles.active : ''}`} onClick={() => setActiveTab('fines')}>MULTE</div>
                                        <div className={`${styles.tab} ${activeTab === 'notes' ? styles.active : ''}`} onClick={() => setActiveTab('notes')}>NOTE</div>
                                        <div className={`${styles.tab} ${activeTab === 'complaints' ? styles.active : ''}`} onClick={() => setActiveTab('complaints')}>RECLAMI</div>
                                    </div>
                                    <button className={styles.actionButton} onClick={() => setShowModal(activeTab.slice(0, -1))}>
                                        + AGGIUNGI {activeTab.slice(0, -1).toUpperCase()}
                                    </button>
                                    <div className={styles.recordsList}>
                                        {activeTab === 'crimes' && selectedPlayer.crimes.map(crime => (
                                            <div key={crime.id} className={styles.recordItem}>
                                                <div className={styles.recordHeader}>DATA: {crime.date}</div>
                                                <div className={styles.recordContent}>{crime.text}</div>
                                                <button className={styles.deleteBtn} onClick={() => handleDeleteRecord('crime', crime.id)}>🗑️</button>
                                            </div>
                                        ))}

                                        {activeTab === 'fines' && selectedPlayer.fines.map(fine => (
                                            <div key={fine.id} className={styles.recordItem}>
                                                <div className={styles.recordHeader}>
                                                    DATA: {fine.date} | STATO: {fine.status || 'NON PAGATA'}
                                                </div>
                                                <div className={styles.recordContent}>
                                                    ${fine.amount} - {fine.reason}
                                                </div>
                                                <div style={{position: 'absolute', top: '0.8rem', right: '0.8rem', display: 'flex', gap: '0.5rem'}}>
                                                    {(!fine.status || fine.status !== 'Pagata') && (
                                                        <button 
                                                            className={styles.actionButton} 
                                                            style={{padding: '0.2rem 0.5rem', fontSize: '1rem'}}
                                                            onClick={() => handlePayFine(fine.id)}
                                                        >
                                                            PAGA
                                                        </button>
                                                    )}
                                                    {/* <button className={styles.deleteBtn} style={{position: 'static'}} onClick={() => handleDeleteRecord('fine', fine.id)}>🗑️</button> */}
                                                </div>
                                            </div>
                                        ))}

                                        {activeTab === 'notes' && selectedPlayer.notes.map(note => (
                                            <div key={note.id} className={styles.recordItem}>
                                                <div className={styles.recordHeader}>DATA: {note.date}</div>
                                                <div className={styles.recordContent}>{note.text}</div>
                                                <button className={styles.deleteBtn} onClick={() => handleDeleteRecord('note', note.id)}>🗑️</button>
                                            </div>
                                        ))}

                                        {activeTab === 'complaints' && selectedPlayer.complaints.map(comp => (
                                            <div key={comp.id} className={styles.recordItem}>
                                                <div className={styles.recordHeader}>DATA: {comp.date}</div>
                                                <div className={styles.recordContent}>{comp.text}</div>
                                                <button className={styles.deleteBtn} onClick={() => handleDeleteRecord('complaint', comp.id)}>🗑️</button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyState}>SELEZIONA UN CITTADINO DAL DATABASE</div>
                            )}
                        </div>
                    </>
                )}

                {/* VEHICLES VIEW */}
                {mainView === 'vehicles' && (
                    <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                        <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="TARGA..." 
                                value={vehicleQuery}
                                onChange={(e) => setVehicleQuery(e.target.value.toUpperCase())}
                                disabled={isTracking}
                                style={{ opacity: isTracking ? 0.5 : 1, cursor: isTracking ? 'not-allowed' : 'text' }}
                            />
                            <button 
                                className={styles.actionButton} 
                                onClick={handleVehicleSearch}
                                disabled={isTracking}
                                style={{ opacity: isTracking ? 0.5 : 1, cursor: isTracking ? 'not-allowed' : 'pointer' }}
                            >
                                CERCA
                            </button>
                        </div>
                        {searchedVehicle && (
                            <div className={styles.recordItem}>
                                <div className={styles.recordHeader}>RISULTATO RICERCA</div>
                                <div className={styles.recordContent}>
                                    <div>TARGA: {searchedVehicle.plate}</div>
                                    <div>PROPRIETARIO: {searchedVehicle.owner}</div>
                                    <div>MODELLO: {searchedVehicle.model}</div>
                                    <div>POSIZIONE: {searchedVehicle.found ? 'TRACCIATO' : 'NON IN CITTÀ'}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ANKLETS VIEW */}
                {mainView === 'anklets' && (
                    <div className={styles.recordsList} style={{width: '100%'}}>
                        {anklets.map(anklet => (
                            <div key={anklet.id} className={styles.recordItem} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div className={styles.recordHeader}>ID: {anklet.id}</div>
                                    <div className={styles.recordContent}>{anklet.name || 'Sconosciuto'}</div>
                                </div>
                                <button className={styles.actionButton} onClick={() => handleTrack(anklet.id, anklet.name)}>TRACCIA</button>
                            </div>
                        ))}
                        {anklets.length === 0 && <div className={styles.emptyState}>NESSUNA CAVIGLIERA ATTIVA</div>}
                    </div>
                )}

                {/* GLOBAL FINES VIEW */}
                {(mainView === 'unpaid_fines' || mainView === 'expired_fines') && (
                    <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
                         <div className={styles.tabs}>
                            <div className={`${styles.tab} ${mainView === 'unpaid_fines' ? styles.active : ''}`} onClick={() => setMainView('unpaid_fines')}>NON PAGATE</div>
                            <div className={`${styles.tab} ${mainView === 'expired_fines' ? styles.active : ''}`} onClick={() => setMainView('expired_fines')}>SCADUTE</div>
                        </div>
                        <div className={styles.finesGrid}>
                            {globalFines.map(fine => (
                                <div key={fine.id} className={styles.recordItem}>
                                    <div className={styles.recordHeader}>
                                        DATA: {fine.date} | CITTADINO: {fine.firstname} {fine.lastname}
                                    </div>
                                    <div className={styles.recordContent}>
                                        ${fine.amount} - {fine.reason}
                                    </div>
                                    <button 
                                        className={styles.actionButton} 
                                        style={{position: 'absolute', top: '0.8rem', right: '0.8rem', padding: '0.2rem 0.5rem', fontSize: '1rem'}}
                                        onClick={() => handlePayFine(fine.id)}
                                    >
                                        PAGA
                                    </button>
                                </div>
                            ))}
                            {globalFines.length === 0 && <div className={styles.emptyState}>NESSUNA MULTA TROVATA</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>AGGIUNGI {showModal.toUpperCase()}</h3>
                        <div className={styles.formGroup}>
                            <label>DESCRIZIONE / MOTIVO</label>
                            <textarea 
                                rows="4" 
                                ref={textRef}
                                placeholder="Inserisci dettagli..."
                            />
                        </div>
                        {showModal === 'fine' && (
                            <div className={styles.formGroup}>
                                <label>IMPORTO ($)</label>
                                <input 
                                    type="number" 
                                    value={modalAmount} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setModalAmount(val);
                                    }}
                                />
                            </div>
                        )}
                        <div className={styles.modalActions}>
                            <button className={styles.actionButton} onClick={() => { setShowModal(null); setModalAmount(''); if(textRef.current) textRef.current.value = ''; }}>ANNULLA</button>
                            <button className={`${styles.actionButton} ${styles.active}`} onClick={handleAddRecord}>CONFERMA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sheriff;
