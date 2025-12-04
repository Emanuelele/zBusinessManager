-- Income Module - Server Side
-- Generates passive income based on player count in business zones

-- Income generation thread - runs every minute
CreateThread(function()
    while true do
        Wait(60000) -- 1 minute
        
        print("[Income] Starting generation cycle...")
        
        for businessId, business in pairs(Config.BusinessDefinitions) do
            if business.zone and business.zone.players then
                -- Count players in zone
                local playerCount = 0
                for _ in pairs(business.zone.players) do
                    playerCount = playerCount + 1
                end
                
                print(string.format("[Income] Business: %s, Players in zone: %d", businessId, playerCount))
                
                -- Get business data
                local data = GetBusinessData(businessId)
                
                -- Initialize income data if missing
                if not data.income then
                    print("[Income] Initializing missing income data")
                    data.income = {
                        balance = 0,
                        totalEarned = 0,
                        upgrades = {
                            minPlayers = 1,
                            maxCap = 1,
                            rate = 1
                        }
                    }
                end
                
                -- Get upgrade levels
                local minPlayersLevel = data.income.upgrades.minPlayers or 1
                local maxCapLevel = data.income.upgrades.maxCap or 1
                local rateLevel = data.income.upgrades.rate or 1
                print("[Income] Upgrade levels - MinPlayers: %d, MaxCap: %d, Rate: %d", minPlayersLevel, maxCapLevel, rateLevel)
                -- Get values from config
                local minPlayers = Config.IncomeUpgrades.minPlayers.levels[minPlayersLevel].value
                local maxCap = Config.IncomeUpgrades.maxCap.levels[maxCapLevel].value
                local rate = Config.IncomeUpgrades.rate.levels[rateLevel].value
                
                print(string.format("[Income] Config - MinPlayers: %d (Lvl %d), MaxCap: %d (Lvl %d), Rate: %d (Lvl %d)", 
                    minPlayers, minPlayersLevel, maxCap, maxCapLevel, rate, rateLevel))
                
                -- Calculate current dirt count
                local currentDirtCount = 0
                if business.zone.dirt then
                    for _ in pairs(business.zone.dirt) do
                        currentDirtCount = currentDirtCount + 1
                    end
                end

                -- Get max dirt capacity
                local capacityLevel = 1
                if data.upgrades and data.upgrades.cleaning and data.upgrades.cleaning.capacity then
                    capacityLevel = data.upgrades.cleaning.capacity
                end
                local maxDirt = Config.CleaningUpgrades.capacity.levels[capacityLevel].value

                print(string.format("[Income] Dirt Check - Current: %d, Max: %d", currentDirtCount, maxDirt))

                if currentDirtCount >= maxDirt then
                    print(string.format("[Income] SKIPPED: Business %s is too dirty! (%d/%d)", businessId, currentDirtCount, maxDirt))
                elseif playerCount >= minPlayers then
                    local effectivePlayers = math.min(playerCount, maxCap)
                    local income = effectivePlayers * rate
                    
                    data.income.balance = data.income.balance + income
                    data.income.totalEarned = data.income.totalEarned + income
                    
                    -- Save to database
                    SaveBusinessData(businessId, data)
                    
                    print(string.format("[Income] SUCCESS: %s generated $%d (players: %d/%d, rate: $%d)", 
                        businessId, income, effectivePlayers, maxCap, rate))
                else
                    print(string.format("[Income] SKIPPED: Not enough players (Has: %d, Needs: %d)", playerCount, minPlayers))
                end
            else
                print(string.format("[Income] Business %s has no active zone or players table", businessId))
            end
        end
    end
end)

-- Get income stats
lib.callback.register('zBusinessManager:server:getIncomeStats', function(source, businessId)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return { success = false } end
    
    local data = GetBusinessData(businessId)
    
    -- Initialize if missing
    if not data.income then
        data.income = {
            balance = 0,
            totalEarned = 0,
            upgrades = {
                minPlayers = 1,
                maxCap = 1,
                rate = 1
            }
        }
    end
    
    -- Count current players
    local playerCount = 0
    if business.zone and business.zone.players then
        for _ in pairs(business.zone.players) do
            playerCount = playerCount + 1
        end
    end
    
    -- Get current upgrade levels
    local levels = data.income.upgrades
    
    return {
        success = true,
        stats = {
            balance = data.income.balance,
            totalEarned = data.income.totalEarned,
            playerCount = playerCount,
            levels = levels,
            config = Config.IncomeUpgrades
        }
    }
end)

-- Collect income
lib.callback.register('zBusinessManager:server:collectIncome', function(source, businessId)
    local data = GetBusinessData(businessId)
    
    if not data.income or data.income.balance <= 0 then
        return { success = false, message = "Nessun introito da riscuotere" }
    end
    
    local amount = data.income.balance
    
    -- Add money to player using ox_inventory
    if exports.ox_inventory:CanCarryItem(source, 'money', amount) then
        if exports.ox_inventory:AddItem(source, 'money', amount) then
            data.income.balance = 0
            SaveBusinessData(businessId, data)
            
            return { success = true, message = string.format("Riscossi $%d", amount) }
        else
            return { success = false, message = "Errore durante il trasferimento" }
        end
    else
        return { success = false, message = "Inventario pieno" }
    end
end)

-- Buy income upgrade
lib.callback.register('zBusinessManager:server:buyIncomeUpgrade', function(source, businessId, upgradeType)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return { success = false, message = "Business non trovato" } end
    
    -- Get business data
    local data = GetBusinessData(businessId)
    
    -- Initialize if missing
    if not data.income then
        data.income = {
            balance = 0,
            totalEarned = 0,
            upgrades = {
                minPlayers = 1,
                maxCap = 1,
                rate = 1
            }
        }
    end
    
    local currentLevel = data.income.upgrades[upgradeType] or 1
    local nextLevel = currentLevel + 1
    
    local upgradeConfig = Config.IncomeUpgrades[upgradeType]
    if not upgradeConfig then return { success = false, message = "Tipo upgrade non valido" } end
    
    local levelData = upgradeConfig.levels[nextLevel]
    if not levelData then return { success = false, message = "Livello massimo raggiunto" } end
    
    -- Check and remove money
    local moneyCount = exports.ox_inventory:Search(source, 'count', 'money')
    
    if moneyCount >= levelData.cost then
        if exports.ox_inventory:RemoveItem(source, 'money', levelData.cost) then
            -- Apply upgrade
            data.income.upgrades[upgradeType] = nextLevel
            
            -- Save to database
            SaveBusinessData(businessId, data)
            
            return { success = true, message = "Upgrade acquistato con successo!" }
        else
            return { success = false, message = "Errore durante il pagamento" }
        end
    else
        return { success = false, message = "Fondi insufficienti" }
    end
end)
