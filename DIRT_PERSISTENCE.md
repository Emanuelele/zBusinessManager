# zBusinessManager - Dirt Persistence

## Installazione

1. **Importa il database**: Esegui il file `business_dirt.sql` nel tuo database MySQL:
   ```sql
   SOURCE business_dirt.sql;
   ```
   Oppure importalo manualmente tramite phpMyAdmin o HeidiSQL.

2. **Riavvia la risorsa**: 
   ```
   restart zBusinessManager
   ```

## Funzionalità

### Sistema di persistenza
Il sistema di dirt è ora persistente e include:

- **Salvataggio automatico**: Quando la risorsa viene fermata (`stop zBusinessManager`), tutto il dirt presente viene salvato nel database
- **Caricamento automatico**: All'avvio della risorsa (`start zBusinessManager`), tutto il dirt viene caricato dal database
- **Salvataggio in tempo reale**: 
  - Quando viene aggiunto nuovo dirt tramite `AddDirt()`, viene salvato immediatamente nel database
  - Quando viene rimosso del dirt tramite `removeDirtPoint`, viene eliminato dal database

### Struttura database

Tabella: `business_dirt`
- `id`: ID univoco auto-incrementale
- `business_key`: Chiave del business (es. "hotel", "bar", ecc.)
- `dirt_id`: ID del dirt all'interno del business
- `prop`: Nome del prop utilizzato per il dirt
- `coords_x`, `coords_y`, `coords_z`: Coordinate del dirt

### Note tecniche

- Il sistema utilizza **oxmysql** (già configurato nel fxmanifest.lua)
- Durante il salvataggio, la tabella viene prima svuotata completamente e poi riempita con i dati correnti
- Il caricamento avviene dopo l'inizializzazione di tutte le zone
- Viene sincronizzato automaticamente con tutti i client dopo il caricamento

## Comandi per test

```lua
-- Aggiungi dirt manualmente (esempio da server console):
local zone = Config.BusinessDefinitions["hotel"].zone
zone:addDirt(5) -- Aggiunge 5 dirt nella zona hotel

-- Verifica il contenuto del database:
SELECT * FROM business_dirt;
```

## Changelog

- ✅ Aggiunta tabella `business_dirt` per persistenza
- ✅ Funzione `LoadDirtFromDatabase()` per caricare il dirt all'avvio
- ✅ Funzione `SaveDirtToDatabase()` per salvare il dirt allo stop
- ✅ Salvataggio in tempo reale quando viene aggiunto nuovo dirt
- ✅ Rimozione dal database quando viene pulito il dirt
- ✅ Fix bug nel parsing dell'ID in `removeDirtPoint`
