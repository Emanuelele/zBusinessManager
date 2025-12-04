-- Funzione per caricare il dirt dal database
local function LoadDirtFromDatabase()
    Wait(3000)
    MySQL.query('SELECT * FROM business_dirt', {}, function(results)
        if results then
            for _, row in ipairs(results) do
                local business = Config.BusinessDefinitions[row.business_key]
                if business and business.zone then
                    local coords = vector3(row.coords_x, row.coords_y, row.coords_z)
                    business.zone.dirt[row.dirt_id] = {
                        prop = row.prop,
                        coords = coords
                    }
                end
            end
            -- Sincronizza tutto il dirt con i client
            for k, v in pairs(Config.BusinessDefinitions) do
                if v.zone and v.zone.dirt and next(v.zone.dirt) then
                    TriggerClientEvent("zBusinessManager:syncDirt", -1, k, v.zone.dirt)
                end
            end
        end
    end)
end


AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then
        return
    end
    for k, v in pairs(Config.BusinessDefinitions) do
        if v.zone then
            local zone = lib.zones.poly({
                name = k .. "_zone",
                k = k,
                points = v.zone.points,
                thickness = v.zone.thickness,
            debug = Config.Debug or false,
            debugColour = { r = 0, g = 0, b = 255, a = 100 },
            players = {},
            dirt = {},

            addDirt = function(self, amount)
                return AddDirt(self, amount)
            end
        })
        v.zone = zone
        local blacklistZones = {}
        for i, blZoneDef in pairs(v.blacklist_zones or {}) do
            local blZone = lib.zones.box({
                name = k .. "_bl_zone_" .. i,
                coords = blZoneDef.coords,
                size = blZoneDef.size,
                rotation = blZoneDef.rotation,
                debug = Config.Debug or false,
                debugColour = { r = 255, g = 0, b = 0, a = 100 },
            })
            table.insert(blacklistZones, blZone)
        end
        v.blacklist_zones = blacklistZones
        end 
    end

    -- Carica il dirt dal database dopo aver inizializzato le zone
    LoadDirtFromDatabase()
end)

-- Salva il dirt quando la risorsa viene fermata
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then
        return
    end
    for businessKey, business in pairs(Config.BusinessDefinitions) do
        if business.dirtNPC then
            ClearPedTasks(business.dirtNPC)
            DeleteEntity(business.dirtNPC)
        end
    end
end)
AddEventHandler("esx:playerLoaded", function(playerId, xPlayer)
    Wait(5000)
    for k, v in pairs(Config.BusinessDefinitions) do
        if v.zone and v.zone.dirt and next(v.zone.dirt) then
            TriggerClientEvent("zBusinessManager:syncDirt", playerId, k, v.zone.dirt)
        end
    end
end)
function IsTooCloseToMainZoneBorder(zone, point, minDist)
    -- Controlliamo 8 direzioni
    local directions = {
        vector3(1, 0, 0),
        vector3(-1, 0, 0),
        vector3(0, 1, 0),
        vector3(0, -1, 0),
        vector3(0.7, 0.7, 0),
        vector3(0.7, -0.7, 0),
        vector3(-0.7, 0.7, 0),
        vector3(-0.7, -0.7, 0)
    }

    for _, dir in ipairs(directions) do
        local testPoint = point + dir * minDist
        if not zone:contains(testPoint) then
            return true
        end
    end

    return false
end

function IsPointInBlacklist(point, blZone)
    local minX = blZone.coords.x - blZone.size.x / 2
    local maxX = blZone.coords.x + blZone.size.x / 2
    local minY = blZone.coords.y - blZone.size.y / 2
    local maxY = blZone.coords.y + blZone.size.y / 2
    local minZ = blZone.coords.z - blZone.size.z / 2
    local maxZ = blZone.coords.z + blZone.size.z / 2

    return point.x >= minX and point.x <= maxX
        and point.y >= minY and point.y <= maxY
        and point.z >= minZ and point.z <= maxZ
end

function GetRandomCoordsInZone(zone, blacklistZones)
    local minX, maxX = math.huge, -math.huge
    local minY, maxY = math.huge, -math.huge
    local minZ, maxZ = math.huge, -math.huge

    for _, point in pairs(zone.points) do
        minX = math.min(minX, point.x)
        maxX = math.max(maxX, point.x)
        minY = math.min(minY, point.y)
        maxY = math.max(maxY, point.y)
        minZ = math.min(minZ, point.z)
        maxZ = math.max(maxZ, point.z)
    end

    local maxAttempts = 150
    for _ = 1, maxAttempts do
        repeat
            local x = math.random() * (maxX - minX) + minX
            local y = math.random() * (maxY - minY) + minY
            local z = math.random() * (maxZ - minZ) + minZ

            local point = vector3(x, y, z)

            if not zone:contains(point) then break end

            if IsTooCloseToMainZoneBorder(zone, point, Config.Dirt.minDistanceFromMainZone) then
                break
            end
            local tooClose = false
            if blacklistZones then
                for _, blZone in ipairs(blacklistZones) do
                    local dx = math.max(blZone.coords.x - blZone.size.x / 2 - point.x, 0,
                        point.x - (blZone.coords.x + blZone.size.x / 2))
                    local dy = math.max(blZone.coords.y - blZone.size.y / 2 - point.y, 0,
                        point.y - (blZone.coords.y + blZone.size.y / 2))
                    local dz = math.max(blZone.coords.z - blZone.size.z / 2 - point.z, 0,
                        point.z - (blZone.coords.z + blZone.size.z / 2))

                    local dist = math.sqrt(dx * dx + dy * dy + dz * dz)

                    if dist < Config.Dirt.minDistanceFromBlacklist then
                        tooClose = true
                        break
                    end
                end
            end
            if tooClose then break end
            return point
        until true
    end

    return nil
end

AddEventHandler("onPlayerDropped", function(playerId, reason)
    for k, v in pairs(Config.BusinessDefinitions) do
        if v.zone.players[playerId] then
            v.zone.players[playerId] = nil
        end
    end
end)
-- Helper per ottenere valore upgrade
local function GetUpgradeValue(businessKey, type)
    local data = GetBusinessData(businessKey)
    -- Recupera livello salvato (default 1)
    local level = 1
    if data and data.upgrades and data.upgrades.cleaning and data.upgrades.cleaning[type] then
        level = data.upgrades.cleaning[type]
    end
    
    local upgradeConfig = Config.CleaningUpgrades[type]
    local value = upgradeConfig.levels[1].value

    if upgradeConfig and upgradeConfig.levels[level] then
        value = upgradeConfig.levels[level].value
    end
    
    --print(string.format("[DEBUG] GetUpgradeValue - Business: %s, Type: %s, Level: %d, Value: %s", businessKey, type, level, tostring(value)))
    return value
end

function AddDirt(zone, amount)
    local newDirts = {}
    local insertValues = {}
    local placeholders = {} -- per la query
    local currentDirtCount = 0
    for _ in pairs(zone.dirt) do
        currentDirtCount = currentDirtCount + 1
    end
    
    -- Usa maxAmount basato su upgrade capacity
    local maxAmount = GetUpgradeValue(zone.k, 'capacity')
    print(string.format("[DEBUG] AddDirt - Business: %s, Current: %d, AmountToAdd: %d, MaxAmount: %d", zone.k, currentDirtCount, amount, maxAmount))
    
    if currentDirtCount + amount >= maxAmount then
        amount = maxAmount - currentDirtCount
    end
    if amount <= 0 then
        return {}
    end
    for i = 1, amount do
        local dirtProp = Config.Dirt.props[math.random(1, #Config.Dirt.props)]
        local coords = GetRandomCoordsInZone(zone, zone.blacklist_zones)
        if coords then
            local id = #zone.dirt + 1
            newDirts[id] = { prop = dirtProp, coords = coords }
            table.insert(zone.dirt, { prop = dirtProp, coords = coords })
            print("Placed dirt: " .. dirtProp .. " at " .. coords)

            -- prepara i valori per la bulk insert
            table.insert(placeholders, "(?, ?, ?, ?, ?, ?)")
            table.insert(insertValues, zone.k)
            table.insert(insertValues, id)
            table.insert(insertValues, dirtProp)
            table.insert(insertValues, coords.x)
            table.insert(insertValues, coords.y)
            table.insert(insertValues, coords.z)
        else
            print("Failed to place dirt: could not find valid coordinates.")
        end
    end


    TriggerClientEvent("zBusinessManager:syncDirt", -1, zone.k, newDirts)
    return insertValues
end

--in base al numero di player nella zona crea un record di sporco ogni tot

CreateThread(function()
    while true do
        local total_inserts = {}

        for businessKey, business in pairs(Config.BusinessDefinitions) do
            local playerCount = 0
            if business.zone and business.zone.players then
                for _ in pairs(business.zone.players) do
                    playerCount = playerCount + 1
                end
            end

            if playerCount >= Config.Dirt.minPlayers then
                local totalDirt = 0
                for _ = 1, playerCount do
                    totalDirt = totalDirt + math.random(Config.Dirt.minPerPlayer, Config.Dirt.maxPerPlayer)
                    print(string.format("Total dirt: %d", totalDirt))
                end

                -- Applica moltiplicatore filtri (riduce accumulo)
                local filterMult = GetUpgradeValue(businessKey, 'filters')
                totalDirt = math.floor(totalDirt * Config.Dirt.multiplier * tonumber(filterMult))
                print(string.format("Total dirt: %d", totalDirt))
                if totalDirt > 0 then
                    local inserts = business.zone:addDirt(totalDirt)
                    for _, val in ipairs(inserts) do
                        table.insert(total_inserts, val)
                    end
                end
            end
        end

        if #total_inserts > 0 then
            local placeholders = {}
            local recordCount = #total_inserts / 6
            for i = 1, recordCount do
                table.insert(placeholders, "(?, ?, ?, ?, ?, ?)")
            end

            local query = "INSERT INTO business_dirt (business_key, dirt_id, prop, coords_x, coords_y, coords_z) VALUES " ..
                table.concat(placeholders, ", ")
            MySQL.insert(query, total_inserts)
        end



        Citizen.Wait(6000) -- ogni minuto
    end
end)
-- CreateThread(function()
--     while true do
--         for businessKey, business in pairs(Config.BusinessDefinitions) do
--             if business.dirtNPC and next(business.zone.dirt) then
--                 Citizen.CreateThread(function()
--                     if business.dirtNPCbusy then
--                         return
--                     end
--                     local random_dirt = math.random(1, #business.zone.dirt)
--                     local targetCoords = business.zone.dirt[random_dirt]?.coords
--                     business.dirtNPCbusy = true
--                     -- Avvia un thread separato per l'NPC
--                     if targetCoords == nil then
--                         print("No target coords found for dirt ID " .. random_dirt .. " in business " .. businessKey)
--                         business.dirtNPCbusy = false
--                         return
--                     end

--                     if not DoesEntityExist(business.dirtNPC) then
--                         print("NPC does not exist for business " .. businessKey)
--                         business.dirtNPCbusy = false
--                         return
--                     end
--                         local closestPlayer = lib.getClosestPlayer(GetEntityCoords(business.dirtNPC), 60.0)
--                         lib.callback.await("zBusinessManager:setnpctask", closestPlayer, NetworkGetNetworkIdFromEntity(business.dirtNPC),targetCoords, random_dirt, businessKey)

--                     if business and business.zone.dirt[random_dirt] then
--                         business.zone.dirt[random_dirt] = nil
--                         TriggerClientEvent("zBusinessManager:removeDirtPoint", -1,
--                             "dirt_" .. businessKey .. "_" .. random_dirt)

--                         -- Rimuovi dal database
--                         MySQL.query('DELETE FROM business_dirt WHERE business_key = ? AND dirt_id = ?', {
--                             businessKey,
--                             random_dirt
--                         }, function(affectedRows)
--                             if #affectedRows > 0 then
--                                 print("Dirt point removed from database: " .. businessKey .. " - " .. random_dirt)
--                             end
--                         end)
--                     end
--                     business.dirtNPCbusy = false
--                 end)
--             end
--         end




--         Citizen.Wait(2000) -- ogni minuto
--     end
-- end)


RegisterNetEvent("zBusinessManager:playerEnteredBusinessZone", function(businessKey)
    local src = source
    local business = Config.BusinessDefinitions[businessKey]
    if business and business.zone and business.zone.players then
        business.zone.players[src] = true
        print("Player " .. src .. " entered business zone: " .. businessKey)
        
        -- Sync upgrades to client
        local dbData = GetBusinessData(businessKey)
        local upgrades = (dbData and dbData.upgrades and dbData.upgrades.cleaning) or {}
        TriggerClientEvent("zBusinessManager:client:updateUpgrades", src, businessKey, upgrades)
    end
end)

RegisterNetEvent("zBusinessManager:playerExitedBusinessZone", function(businessKey)
    local src = source
    local business = Config.BusinessDefinitions[businessKey]
    if business and business.zone and business.zone.players then
        business.zone.players[src] = nil
        print("Player " .. src .. " exited business zone: " .. businessKey)
    end
end)

RegisterNetEvent("zBusinessManager:removeDirtPoint", function(ID)
    --"dirt_" .. businessKey .. "_" .. k
    local businessKey, dirtIdStr = ID:match("dirt_(.-)_(%d+)")
    local dirtId = tonumber(dirtIdStr)
    local business = Config.BusinessDefinitions[businessKey]
    if business and business.zone.dirt[dirtId] then
        business.zone.dirt[dirtId] = nil
        print("Removed dirt point ID " .. dirtId .. " from business " .. businessKey)
        TriggerClientEvent("zBusinessManager:removeDirtPoint", -1, ID)

        -- Rimuovi dal database
        MySQL.query('DELETE FROM business_dirt WHERE business_key = ? AND dirt_id = ?', {
            businessKey,
            dirtId
        }, function(affectedRows)
            -- Optional: log deletion
        end)
    end
end)

-- Batch dirt removal (multiple points at once)
RegisterNetEvent("zBusinessManager:removeDirtPoints", function(IDs)
    if not IDs or #IDs == 0 then return end
    
    local toDelete = {}
    for _, ID in ipairs(IDs) do
        local businessKey, dirtIdStr = ID:match("dirt_(.-)_(%d+)")
        local dirtId = tonumber(dirtIdStr)
        local business = Config.BusinessDefinitions[businessKey]
        
        if business and business.zone.dirt[dirtId] then
            business.zone.dirt[dirtId] = nil
            print("Removed dirt point ID " .. dirtId .. " from business " .. businessKey)
           
            
            table.insert(toDelete, {businessKey, dirtId})
        end
    end
    TriggerClientEvent("zBusinessManager:removeDirtPoints", -1, IDs)
    -- Batch delete from database
    if #toDelete > 0 then
        for _, data in ipairs(toDelete) do
            MySQL.query('DELETE FROM business_dirt WHERE business_key = ? AND dirt_id = ?', {
                data[1],
                data[2]
            })
        end
    end
end)

-- Callback per ottenere stato upgrade
lib.callback.register('zBusinessManager:server:getCleaningUpgrades', function(source, businessId)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return nil end
    
    -- Recupera livelli attuali dal DB
    local dbData = GetBusinessData(businessId)
    local currentLevels = {
        capacity = 1,
        efficiency = 1,
        filters = 1
    }
    
    if dbData and dbData.upgrades and dbData.upgrades.cleaning then
        for k, v in pairs(dbData.upgrades.cleaning) do
            currentLevels[k] = v
        end
    end
    
    -- Calcola sporco attuale
    local currentDirtCount = 0
    if business.zone and business.zone.dirt then
        for _ in pairs(business.zone.dirt) do
            currentDirtCount = currentDirtCount + 1
        end
    end
    
    -- Calcola capacità massima
    local capacityLevel = currentLevels.capacity or 1
    local maxDirt = Config.CleaningUpgrades.capacity.levels[capacityLevel].value

    return {
        success = true,
        data = {
            levels = currentLevels,
            config = Config.CleaningUpgrades,
            stats = {
                current = currentDirtCount,
                max = maxDirt
            }
        }
    }
end)

-- Callback per acquistare upgrade
lib.callback.register('zBusinessManager:server:buyCleaningUpgrade', function(source, businessId, type)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return { success = false, data = "Business non trovato" } end
    
    -- Recupera dati attuali dal DB
    local dbData = GetBusinessData(businessId)
    
    -- Inizializza struttura dati se manca
    if not dbData.upgrades then dbData.upgrades = {} end
    if not dbData.upgrades.cleaning then dbData.upgrades.cleaning = {} end
    
    local currentLevel = dbData.upgrades.cleaning[type] or 1
    local nextLevel = currentLevel + 1
    
    local upgradeConfig = Config.CleaningUpgrades[type]
    if not upgradeConfig then return { success = false, data = "Tipo upgrade non valido" } end
    
    local levelData = upgradeConfig.levels[nextLevel]
    if not levelData then return { success = false, data = "Livello massimo raggiunto" } end
    
    -- Controlla e rimuovi soldi usando ox_inventory
    local moneyCount = exports.ox_inventory:Search(source, 'count', 'money')
    
    if moneyCount >= levelData.cost then
        if exports.ox_inventory:RemoveItem(source, 'money', levelData.cost) then
            -- Applica upgrade
            dbData.upgrades.cleaning[type] = nextLevel
            
            -- Salva nel DB
            SaveBusinessData(businessId, dbData)
            
            -- Aggiorna anche la cache in memoria se usata altrove
            if business.data then
                business.data = dbData
            end
            
            -- Sync upgrades to client
            TriggerClientEvent("zBusinessManager:client:updateUpgrades", source, businessId, dbData.upgrades.cleaning)

            return { success = true, data = "Upgrade acquistato con successo!" }
        else
            return { success = false, data = "Errore durante il pagamento" }
        end
    else
        return { success = false, data = "Fondi insufficienti" }
    end
end)
