-- Crafting NPC Animation Manager (Client-side)
local CraftingNPCs = {}
local activeAnimations = {}
print("^2[CraftNPC] Client-side script loaded^0")
-- Register NPC for animation management
RegisterNetEvent('zBusinessManager:client:registerCraftNPC', function(businessId, npcNetId)
    print("^2[CraftNPC] Registering NPC for " .. businessId .. " (NetID: " .. npcNetId .. ")^0")
    
    -- Wait for entity to exist (it might take a moment to stream in)
    local attempts = 0
    local npc = 0
    
    while not DoesEntityExist(npc) and attempts < 50 do
        npc = NetworkGetEntityFromNetworkId(npcNetId)
        if not DoesEntityExist(npc) then
            Wait(100)
            attempts = attempts + 1
        end
    end
    
    if not DoesEntityExist(npc) then
        print("^1[CraftNPC] Failed to resolve NPC entity for " .. businessId .. " after 5 seconds^0")
        return
    end
    
    CraftingNPCs[businessId] = {
        entity = npc,
        netId = npcNetId
    }
    
    print("^2[CraftNPC] Successfully registered NPC for " .. businessId .. "^0")
    SetBlockingOfNonTemporaryEvents(npc, true)
    SetEntityInvincible(npc, true)
end)


-- Start crafting animation (triggered by closest client)
RegisterNetEvent('zBusinessManager:client:startCraftAnimation', function(businessId)
    local npcData = CraftingNPCs[businessId]
    if not npcData then return end
    
    local npc = npcData.entity
    if not DoesEntityExist(npc) then
        -- Try to get entity from network ID
        npc = NetworkGetEntityFromNetworkId(npcData.netId)
        if not DoesEntityExist(npc) then return end
        npcData.entity = npc
    end
    NetworkRequestControlOfEntity(npc)
    while not NetworkHasControlOfEntity(npc) do
        Wait(10)
    end
    print("^2[CraftNPC] Starting animation for " .. businessId .. "^0")
    
    
    -- Load animation dict
    local animDict = Config.BusinessDefinitions[businessId].craftnpc.anim_on_craft.dict
    local animName = Config.BusinessDefinitions[businessId].craftnpc.anim_on_craft.anim
    
    RequestAnimDict(animDict)
    while not HasAnimDictLoaded(animDict) do
        Wait(10)
    end
    
    -- Play animation
    TaskPlayAnim(npc, animDict, animName, 8.0, -8.0, -1, 1, 0, false, false, false)
    activeAnimations[businessId] = true
    
    print(string.format("^2[CraftNPC] Started animation for %s^0", businessId))
end)

-- Stop crafting animation
RegisterNetEvent('zBusinessManager:client:stopCraftAnimation', function(businessId)
    local npcData = CraftingNPCs[businessId]
    if not npcData or not activeAnimations[businessId] then return end
    
    local npc = npcData.entity
    if not DoesEntityExist(npc) then
        npc = NetworkGetEntityFromNetworkId(npcData.netId)
        if not DoesEntityExist(npc) then return end
    end
    
    -- Check if we're managing this NPC's animation
    local playerCoords = GetEntityCoords(PlayerPedId())
    local npcCoords = GetEntityCoords(npc)
    local distance = #(playerCoords - npcCoords)
    
    if distance > 100.0 then return end
    
    -- Stop animation
    ClearPedTasks(npc)
    activeAnimations[businessId] = false
    
    print(string.format("^3[CraftNPC] Stopped animation for %s^0", businessId))
end)

-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
    for businessId, npcData in pairs(CraftingNPCs) do
        if DoesEntityExist(npcData.entity) then
            ClearPedTasks(npcData.entity)
        end
    end
end)
