-- NPC Management Server Module

lib.callback.register('zBusinessManager:server:hireCraftingNPC', function(source, businessId)
    local data = GetBusinessData(businessId)
    local business = Config.BusinessDefinitions[businessId]
    
    if not business or not business.craftnpc then
        return { success = false, message = 'No crafting NPC available' }
    end
    
    if not data.crafting then data.crafting = {} end

    if data.crafting and data.crafting.npc then
        return { success = false, message = 'NPC already hired' }
    end
    
    local level1 = Config.NPC.Levels[1]
    if not level1 then return { success = false, message = 'Invalid NPC configuration' } end
    
    data.crafting.npc = { level = 1, lastPaymentTime = os.time(), wage = level1.wage }
    SaveBusinessData(businessId, data)
    CraftManager.InitNPC(businessId, business, data)
    
    return { success = true, data = data }
end)

lib.callback.register('zBusinessManager:server:getNPCStats', function(source, businessId)
    local data = GetBusinessData(businessId)
    if not data.crafting or not data.crafting.npc then return { success = false, message = 'NPC not hired' } end
    
    local npc = data.crafting.npc
    local levelData = Config.NPC.Levels[npc.level]
    local nextLevelData = Config.NPC.Levels[npc.level + 1]
    
    return {
        success = true,
        stats = {
            level = npc.level,
            wage = npc.wage,
            lastPaymentTime = npc.lastPaymentTime,
            craftSpeed = levelData.craftSpeed,
            queueSize = levelData.queueSize,
            nextLevel = nextLevelData
        }
    }
end)

lib.callback.register('zBusinessManager:server:upgradeNPC', function(source, businessId)
    local data = GetBusinessData(businessId)
    if not data.crafting or not data.crafting.npc then return { success = false, message = 'NPC not hired' } end
    
    local currentLevel = data.crafting.npc.level
    local nextLevelData = Config.NPC.Levels[currentLevel + 1]
    if not nextLevelData then return { success = false, message = 'Max level reached' } end
    
    data.crafting.npc.level = currentLevel + 1
    data.crafting.npc.wage = nextLevelData.wage
    SaveBusinessData(businessId, data)
    return { success = true, data = data }
end)

lib.callback.register('zBusinessManager:server:payNPCWage', function(source, businessId)
    local data = GetBusinessData(businessId)
    if not data.crafting or not data.crafting.npc then return { success = false, message = 'NPC not hired' } end
    
    data.crafting.npc.lastPaymentTime = os.time()
    SaveBusinessData(businessId, data)
    return { success = true, message = 'Wage paid' }
end)
