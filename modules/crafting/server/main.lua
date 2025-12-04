-- Craft Manager Module
CraftManager = {}
CraftManager.npcs = {}
CraftManager.craftQueues = {}
CraftManager.lastCraftTime = {}
CraftManager.SaveCallback = nil -- Function to save data
CraftManager.processingQueues = {} -- Track which queues are being processed

-- Inizializza NPC crafting per un business
function CraftManager.InitNPC(businessId, businessData, currentDbData)
    if not businessData.craftnpc then return end
    
    -- Check if NPC is hired in DB
    local dbData = currentDbData or GetBusinessData(businessId)
    if not dbData.crafting or not dbData.crafting.npc then
        print("^3[CraftManager] NPC not hired for " .. businessId .. ", skipping spawn^0")
        return 
    end

    local npcData = businessData.craftnpc
    
    -- Spawn NPC
    local coords = npcData.coords
    local heading = npcData.heading or 0.0
    
    local npcHash = GetHashKey(npcData.model)
    
    local npc = CreatePed(4, npcHash, coords.x, coords.y, coords.z, heading, true, true)
    
    FreezeEntityPosition(npc, true)
    
    -- Make NPC networked so clients can see it
    local netId = NetworkGetNetworkIdFromEntity(npc)
    
    CraftManager.npcs[businessId] = npc
    
    print("^2[CraftManager] NPC spawned for " .. businessId .. " (NetID: " .. netId .. ")")
    
    -- Notify client to register this NPC
    TriggerClientEvent('zBusinessManager:client:registerCraftNPC', -1, businessId, netId)

    
    -- Registra stash
    if npcData.stock_stash then
        exports.ox_inventory:RegisterStash(
            npcData.stock_stash.id,
            npcData.stock_stash.label,
            npcData.stock_stash.slots,
            npcData.stock_stash.maxWeight,
            false
        )
    end

    Wait(1000)
    -- Trigger idle animation
    CraftManager.TriggerIdleAnimation(businessId)
end

-- Rimuovi NPC
function CraftManager.RemoveNPC(businessId)
    print("^2[CraftManager] Removing NPC for " .. businessId .. "^0")
    if CraftManager.npcs[businessId] then
        DeleteEntity(CraftManager.npcs[businessId])
        CraftManager.npcs[businessId] = nil
    end
end

-- Carica coda dal DB
function CraftManager.LoadQueue(businessId, queueData)
    if queueData then
        CraftManager.craftQueues[businessId] = queueData
        -- Riavvia processo se ci sono item
        if #queueData > 0 then
            CraftManager.ProcessQueue(businessId, nil)
        end
    end
end

-- Inizia crafting
function CraftManager.StartCraft(source, businessId, itemName, dbData)
    if not dbData.crafting then dbData.crafting = {} end
    -- Anti-spam
    local lockKey = businessId .. "_" .. source
    local now = GetGameTimer()
    local lastTime = CraftManager.lastCraftTime[lockKey] or 0
    
    if (now - lastTime) < 500 then
        return false, "Richiesta troppo veloce"
    end
    CraftManager.lastCraftTime[lockKey] = now
    
    -- Checks NPC
    if not dbData.crafting.npc then
        return false, "Devi assumere un NPC per craftare!"
    end

    -- Check Wage (Strike)
    local lastPayment = dbData.crafting.npc.lastPaymentTime or 0
    if (os.time() - lastPayment) > (7 * 24 * 60 * 60) then
        return false, "NPC in sciopero! Paga lo stipendio."
    end
    
    local businessData = Config.BusinessDefinitions[businessId]
    local craftData = businessData.craftnpc.items[itemName]
    if not craftData then return false, "Ricetta non trovata" end
    
    -- Check Queue Size
    local currentQueue = CraftManager.craftQueues[businessId] or {}
    local npcLevel = dbData.crafting.npc.level or 1
    local maxQueue = Config.NPC.Levels[npcLevel].queueSize
    
    if #currentQueue >= maxQueue then
        return false, "Coda di produzione piena!"
    end

    -- Check Materials
    local missingItems = {}
    local hasItems = true
    for _, req in ipairs(craftData.required) do
        local count = exports.ox_inventory:Search({ id = "business_craft_stock", owner = businessId }, 'count', req.item)
        if count < req.quantity then
            hasItems = false
            table.insert(missingItems, { item = req.item, needed = req.quantity, has = count })
        end
    end
    
    if not hasItems then return false, "Materiali insufficienti", missingItems end
    
    -- Remove Materials
    for _, req in ipairs(craftData.required) do
        exports.ox_inventory:RemoveItem({ id = "business_craft_stock", owner = businessId }, req.item, req.quantity)
    end
    
    -- Calculate Time
    local baseTime = businessData.craftnpc.craft_time or 10000
    local speedMult = Config.NPC.Levels[npcLevel].craftSpeed
    local finalTime = math.floor(baseTime * speedMult)

    -- Add to Queue
    if not CraftManager.craftQueues[businessId] then CraftManager.craftQueues[businessId] = {} end
    
    table.insert(CraftManager.craftQueues[businessId], {
        playerId = source,
        item = itemName,
        duration = finalTime,
        craftData = {
            label = craftData.label,
            required = craftData.required
        }
        -- startTime will be set when processing starts
    })
    
    -- Save DB
    dbData.crafting.queue = CraftManager.craftQueues[businessId]
    if CraftManager.SaveCallback then CraftManager.SaveCallback(businessId, dbData) end
    
    -- Start Process (only if not already processing)
    if not CraftManager.processingQueues[businessId] then
        CraftManager.ProcessQueue(businessId, dbData)
    end
    
    CraftManager.TriggerAnimation(businessId)
    return true, "Crafting iniziato"
end

-- Helper per triggerare animazione sul client più vicino
function CraftManager.TriggerAnimation(businessId)
    local bData = Config.BusinessDefinitions[businessId]
    if not bData or not bData.craftnpc then return end
    
    -- local coords = bData.craftnpc.coords
    -- local targetPlayer = lib.getClosestPlayer(vector3(coords.x, coords.y, coords.z), 40.0)
    
    -- if targetPlayer then
    --     TriggerClientEvent('zBusinessManager:client:startCraftAnimation', targetPlayer, businessId)
    -- end
        -- Load animation dict
    local animDict = Config.BusinessDefinitions[businessId].craftnpc.anim_on_craft.dict
    local animName = Config.BusinessDefinitions[businessId].craftnpc.anim_on_craft.anim
    
    
    -- Play animation
    TaskPlayAnim(CraftManager.npcs[businessId], animDict, animName, 8.0, -8.0, -1, 1, 0, false, false, false)
end

function CraftManager.TriggerIdleAnimation(businessId)
    local bData = Config.BusinessDefinitions[businessId]
    if not bData or not bData.craftnpc then return end
    

        -- Load animation dict
    local animDict = Config.BusinessDefinitions[businessId].craftnpc.animIdle.dict
    local animName = Config.BusinessDefinitions[businessId].craftnpc.animIdle.name
    
    print("^2[zBusinessManager] Triggering idle animation for business " .. businessId, CraftManager.npcs[businessId], animDict, animName)
    -- Play animation
    TaskPlayAnim(CraftManager.npcs[businessId], animDict, animName, 8.0, -8.0, -1, 1, 0, false, false, false)
end

-- Processa coda crafting
function CraftManager.ProcessQueue(businessId, dbData)
    -- Prevent multiple threads processing same queue
    if CraftManager.processingQueues[businessId] then
        return
    end
    
    CraftManager.processingQueues[businessId] = true
    
    CreateThread(function()
        while CraftManager.craftQueues[businessId] and #CraftManager.craftQueues[businessId] > 0 do
            -- Ensure animation is playing for the closest player
            CraftManager.TriggerAnimation(businessId)
            
            local currentCraft = CraftManager.craftQueues[businessId][1]
            
            -- Set startTime NOW (when we actually start processing)
            if not currentCraft.startTime then
                currentCraft.startTime = os.time()
                -- Update UI immediately so client knows it started
                TriggerClientEvent('zBusinessManager:updateCraftQueue', -1, businessId, CraftManager.GetFormattedQueue(businessId))
            end
            
            -- Reconstruct data if missing (from load)
            if not currentCraft.craftData then
                local bData = Config.BusinessDefinitions[businessId]
                currentCraft.craftData = bData.craftnpc.items[currentCraft.item]
            end

            local craftTime = currentCraft.duration or 10000
            local waitTime = craftTime

            -- If resuming (startTime exists), calculate remaining time
            if currentCraft.startTime then
                local elapsedSeconds = os.time() - currentCraft.startTime
                local elapsedMs = elapsedSeconds * 1000
                waitTime = math.max(0, craftTime - elapsedMs)
            end
            
            -- Wait for the remaining duration
            Wait(waitTime)
            
            -- Give Item
            exports.ox_inventory:AddItem({ id = "business_craft_stock", owner = businessId }, currentCraft.item, 1)
            
            -- Notify (if player online)
            if currentCraft.playerId then
                TriggerClientEvent('zBusinessManager:notify', currentCraft.playerId, 'success', 'Produzione completata: ' .. currentCraft.craftData.label)
            end
            
            -- Remove from queue
            table.remove(CraftManager.craftQueues[businessId], 1)
            
            -- Save DB
            if CraftManager.OnQueueUpdate then
                CraftManager.OnQueueUpdate(businessId, CraftManager.craftQueues[businessId])
            elseif dbData then
                -- Fallback legacy
                dbData.crafting.queue = CraftManager.craftQueues[businessId]
                if CraftManager.SaveCallback then CraftManager.SaveCallback(businessId, dbData) end
            end
            
            -- Update UI
            TriggerClientEvent('zBusinessManager:updateCraftQueue', -1, businessId, CraftManager.GetFormattedQueue(businessId))
            
            -- Check if queue is now empty - stop animation
            if #CraftManager.craftQueues[businessId] == 0 then
                ClearPedTasks(CraftManager.npcs[businessId])

                CraftManager.TriggerIdleAnimation(businessId)
            end
        end
        
        -- Clear processing flag when queue is empty
        CraftManager.processingQueues[businessId] = nil
    end)
end

-- Ottieni coda crafting
function CraftManager.GetQueue(businessId)
    return CraftManager.craftQueues[businessId] or {}
end

-- Helper per formattare la coda per la UI (aggiunge label, duration, ecc)
function CraftManager.GetFormattedQueue(businessId)
    local queue = CraftManager.GetQueue(businessId)
    local data = GetBusinessData(businessId)
    local npcLevel = (data.crafting and data.crafting.npc) and data.crafting.npc.level or 1
    local speedMult = Config.NPC.Levels[npcLevel].craftSpeed
    local businessData = Config.BusinessDefinitions[businessId]
    local baseTime = businessData and businessData.craftnpc and businessData.craftnpc.craft_time or 10000
    local craftTime = math.floor(baseTime * speedMult)
    
    local queueWithProgress = {}
    for i, craft in ipairs(queue) do
        local itemDuration = craft.duration or craftTime
        local label = craft.craftData and craft.craftData.label or craft.item
        
        table.insert(queueWithProgress, {
            item = craft.item,
            label = label,
            startTime = craft.startTime,
            duration = itemDuration,
            playerId = craft.playerId
        })
    end
    return queueWithProgress
end

-- Ottieni materiali disponibili nello stash
function CraftManager.GetStashItems(businessId)
    local businessData = Config.BusinessDefinitions[businessId]
    if not businessData or not businessData.craftnpc then return {} end
    
    -- Try to get inventory
    local inv = exports.ox_inventory:GetInventory({ id = "business_craft_stock", owner = businessId })
    if not inv or not inv.items then return {} end
    
    local result = {}
    for slot, item in pairs(inv.items) do
        if item and item.name and item.count then
            result[item.name] = (result[item.name] or 0) + item.count
        end
    end
    return result
end


-- Callbacks
lib.callback.register('zBusinessManager:server:getCraftRecipes', function(source, businessId)
    local businessData = Config.BusinessDefinitions[businessId]
    if not businessData or not businessData.craftnpc then return { success = false, recipes = {} } end
    
    local recipes = {}
    for itemName, itemData in pairs(businessData.craftnpc.items) do
        table.insert(recipes, { id = itemName, label = itemData.label, required = itemData.required })
    end
    return { success = true, recipes = recipes }
end)

lib.callback.register('zBusinessManager:server:getCraftStock', function(source, businessId)
    return { success = true,  stock = CraftManager.GetStashItems(businessId) }
end)

lib.callback.register('zBusinessManager:server:startCraft', function(source, businessId, itemName)
    local data = GetBusinessData(businessId)
    local success, message, missingItems = CraftManager.StartCraft(source, businessId, itemName, data)
    return { success = success, message = message, missingItems = missingItems }
end)

lib.callback.register('zBusinessManager:server:getCraftQueue', function(source, businessId)
    local queueWithProgress = CraftManager.GetFormattedQueue(businessId)
    return { success = true, queue = queueWithProgress }
end)

lib.callback.register('zBusinessManager:server:openCraftStash', function(source, businessId)
    local businessData = Config.BusinessDefinitions[businessId]
    if not businessData or not businessData.craftnpc then return { success = false } end
    
    TriggerClientEvent("ox_inventory:openInventory", source, "stash", { id = "business_craft_stock", owner = businessId })
    return { success = true }
end)

local connected_clients = {}

RegisterNetEvent("zBusinessManager:server:openTerminal", function(businessId)
    if not businessId then return end
    connected_clients[businessId] = connected_clients[businessId] or {}
    print("Opening terminal for business: " .. businessId .. " for player: " .. source)
    table.insert(connected_clients[businessId], source)
end)

RegisterNetEvent("zBusinessManager:server:closeTerminal", function(businessId)
    if not businessId or not connected_clients[businessId] then return end
    -- remove source from connected_clients[businessId]
    for i, v in ipairs(connected_clients[businessId]) do
        if v == source then
            print("Closing terminal for business: " .. businessId .. " for player: " .. source)
            table.remove(connected_clients[businessId], i)
            break
        end
    end
end)

--listen stashinventorys updates

exports.ox_inventory:registerHook('swapItems', function(payload)
    local businessId
    print(json.encode(payload, { indent = true }))
    -- Helper to extract businessId from inventory string (format: business_craft_stock:BUSINESS_ID)
    local function getBusinessId(inv)
        if type(inv) == 'table' then inv = inv.id or inv.label end -- Handle if inv is object
        if type(inv) ~= 'string' then return nil end
        
        -- Try to match "business_craft_stock:ID"
        -- If the stash is registered as "business_craft_stock" with owner, ox_inventory might format it differently
        -- But based on user's code, they expect "business_craft_stock:ID"
        local _, id = inv:match("^(.-):(.+)$")
        return id
    end

    -- only if item is removed or added
    if payload.fromType == 'stash' and payload.toType == 'player' then 
        businessId = getBusinessId(payload.fromInventory)
        
        if businessId and connected_clients[businessId] then
            local items = CraftManager.GetStashItems(businessId)
            -- remove the new items to the stash
            local item = payload.fromSlot.name
            local count = payload.fromSlot.count
            items[item] = items[item] - count
            if items[item] <= 0 then
                items[item] = nil
            end
            for _, v in ipairs(connected_clients[businessId]) do

                TriggerClientEvent('zBusinessManager:client:syncStock', v, items)
            end
        end
        return true
    end
    
    if payload.fromType == 'player' and payload.toType == 'stash' then
        businessId = getBusinessId(payload.toInventory)
        
        if businessId and connected_clients[businessId] then
            local items = CraftManager.GetStashItems(businessId)
            -- add the new items to the stash
            local item = payload.fromSlot.name
            local count = payload.fromSlot.count
            if not items[item] then
                items[item] = 0
            end
            items[item] = items[item] + count
            for _, v in ipairs(connected_clients[businessId]) do

                TriggerClientEvent('zBusinessManager:client:syncStock', v, items)
            end
        end
        return true
    end
    
    return true
end, {
    print = true,
    inventoryFilter = {
        '^business_craft_stock',
    }
})

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    Wait(1000)
    CraftManager.SaveCallback = SaveBusinessData
    
    -- Callback to safely update queue with fresh data
    CraftManager.OnQueueUpdate = function(businessId, queue)
        local data = GetBusinessData(businessId)
        if data and data.crafting then
            data.crafting.queue = queue
            SaveBusinessData(businessId, data)
        end
    end

    exports.ox_inventory:RegisterStash('business_craft_stock', 'Business Craft Stock', 100, 100000, true)
    
    for businessId, businessData in pairs(Config.BusinessDefinitions) do
        if businessData.craftnpc then
            CraftManager.InitNPC(businessId, businessData)
            local data = GetBusinessData(businessId)
            if not data.crafting then data.crafting = {} end
            if data.crafting.queue then
                CraftManager.LoadQueue(businessId, data.crafting.queue)
            end
        end
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    for businessKey, business in pairs(Config.BusinessDefinitions) do
        if business.craftnpc then
            CraftManager.RemoveNPC(businessKey)
        end
    end
end)

RegisterCommand("clear_stashes", function()
    for businessId, _ in pairs(Config.BusinessDefinitions) do
        exports.ox_inventory:ClearInventory({ id = "business_craft_stock", owner = businessId })
    end
end)
