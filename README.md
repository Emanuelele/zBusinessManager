# zBusinessManager v2.0

Sistema completo di gestione business con UI in stile terminale anni '70 su DUI.

## ✅ Implementato

### Client (`client/main.lua`)
- ✅ Sistema DUI su prop con texture replacement
- ✅ Integrazione ox_target per interazione
- ✅ Camera automatica quando usi il terminale
- ✅ NUI callbacks per comunicazione con UI

### Server (`server/main.lua`)
- ✅ Sistema di autenticazione per business
- ✅ Database MySQL per salvare dati
- ✅ Sistema crafting con NPC
- ✅ Sistema pulizia con upgrades
- ✅ Sistema introiti passivi
- ✅ Sistema ordini
- ✅ Thread per calcolo introiti passivi ogni minuto

### UI React (`ui/`)
- ✅ Tema CRT/terminale anni '70
- ✅ Routing con React Router
- ✅ Pagine: Login, Home, Crafting, Cleaning, Income, Orders
- ✅ Build Vite completata in `ui/dist/`

## 📋 Da Completare

### 1. Implementare le pagine React

Le pagine esistono ma hanno solo placeholder. Devi completare:

#### `ui/src/pages/Home.jsx`
- Grid di 4 card cliccabili che navigano a:
  - Crafting
  - Cleaning
  - Income
  - Orders
- Icona pixelata "omino" in alto a sinistra

#### `ui/src/pages/Crafting.jsx`
- Sezione "Crafting Manuale" con lista items craftabili
- Sezione "NPC Crafters" con lista NPC assunti
- Possibilità di assumere nuovo NPC
- Per ogni NPC: upgrades (craft speed, queue size, wage reduction)
- Coda crafting attiva

#### `ui/src/pages/Cleaning.jsx`
- Barra progresso livello sporcizia
- 4 upgrade buttons:
  - Riduzione sporcizia generata
  - Cap massimo sporcizia
  - Velocità pulizia
  - Props simultanei pulibili

#### `ui/src/pages/Income.jsx`
- Display balance corrente
- Display total earned
- Display players in zona
- 3 upgrade buttons:
  - Riduzione min players richiesti
  - Aumento max cap introiti
  - Aumento rate per player
- Bottone "Withdraw" per ritirare soldi

#### `ui/src/pages/Orders.jsx`
- Form per creare nuovo ordine (items + delivery type)
- Lista ordini attivi con stato
- Per Willie's: lista ordini ricevuti da accettare

### 2. Server - Completare TODO

In `server/main.lua` ci sono vari `TODO`:

```lua
-- TODO: Verifica scorte in ox_inventory
-- TODO: Check money (usa exports['es_extended']:getSharedObject())
-- TODO: Remove money
-- TODO: Give money to player
-- TODO: Dai item al player
```

### 3. Config - Aggiungere items craftabili

In `config.lua` aggiungi:

```lua
Config.CraftableItems = {
    ['water'] = {
        label = 'Water',
        ingredients = {
            ['plastic'] = 1
        },
        craftTime = 10 -- secondi
    },
    -- ... altri items
}
```

### 4. Database

La tabella `business_data` viene creata automaticamente all'avvio.

### 5. Testing

1. Riavvia la risorsa: `restart zBusinessManager`
2. Vai alle coordinate del prop: `-266.965, 6228.639, 36.211`
3. Dovresti vedere la DUI sul prop (tema verde terminale)
4. Usa ox_target sul prop per aprire il terminale
5. Login con credenziali in config:
   - Username: `pipe`
   - Password: `pipe`

## 🎨 Personalizzazione UI

### Colori
In `ui/src/index.css`:
```css
--terminal-green: #00ff41;  /* Verde fosforescente */
--terminal-green-dim: #00aa2b;
--terminal-bg: #0a0e0a;  /* Nero verdastro */
```

### Aggiungere nuovo business

In `config.lua`:
```lua
Config.BusinessDefinitions = {
    nuovo_business = {
        label = "Nome Business",
        zone = { points = {...}, thickness = 3 },
        terminal = {
            coords = vec3(x, y, z),
            prop_model = "markz_prop_sheriff_terminal",
            texturedict = "markz_props_terminal_ytd",
            texture = "markz_terminalscreen_d"
        },
        credentials = {
            username = "user",
            password = "pass"
        }
    }
}
```

## 🔧 Build UI

Quando modifichi la UI React:

```bash
cd ui
npm install  # solo la prima volta
npm run build
```

Poi riavvia la risorsa in game.

## 📝 Struttura Files

```
zBusinessManager/
├── client/
│   ├── main.lua          # Gestione DUI e NUI
│   └── dirt.lua          # Sistema sporcizia (esistente)
├── server/
│   └── main.lua          # Callbacks e logica server
├── ui/
│   ├── src/
│   │   ├── pages/        # Pagine React da completare
│   │   ├── components/
│   │   └── App.jsx
│   └── dist/             # Build output (autogenerato)
├── config.lua
└── fxmanifest.lua
```

## 🐛 Debug

- Console F8 per vedere messaggi debug
- Tutti i print hanno colori: `^2` = verde (success), `^1` = rosso (error), `^3` = giallo (warning)
- Controlla console browser (F12) per errori UI React

## ✨ Features Extra da Aggiungere

1. **Animazioni crafting** - Progress bar real-time
2. **Notifiche in-game** - Quando completa crafting, ritira soldi, etc
3. **Permessi** - Solo owner/manager può usare terminale
4. **Statistiche avanzate** - Grafici income nel tempo
5. **Sound effects** - Suoni CRT quando apri/chiudi terminale

---

**Fatto da:** zeta
**Versione:** 2.0.0
**Data:** 2025
