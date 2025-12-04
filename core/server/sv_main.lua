
-- Inizializza database
CreateThread(function()
    MySQL.query([[
        CREATE TABLE IF NOT EXISTS business_data (
            business_id VARCHAR(50) PRIMARY KEY,
            data LONGTEXT NOT NULL
        )
    ]])
end)

-- ============================================
-- GLOBAL FUNCTIONS (Used by modules)
-- ============================================

-- Ottieni dati business (GLOBAL - used by modules)
function GetBusinessData(businessId)
    local result = MySQL.query.await('SELECT data FROM business_data WHERE business_id = ?', { businessId })

    if result and result[1] then
        return json.decode(result[1].data)
    end

    return {
        crafting = {
            npcs = {},
            queue = {},
            storage = {},
            upgrades = {
                npcSlots = 0,
                queueSize = 1,
                craftSpeed = 0
            }
        },
        cleaning = {
            dirtLevel = 0,
            maxDirt = 100,
            upgrades = {
                dirtReduction = 0,
                maxDirtCap = 0,
                cleanSpeed = 0,
                simultaneousClean = 1
            }
        },
        income = {
            balance = 0,
            totalEarned = 0,
            upgrades = {
                minPlayers = 1,
                maxCap = 1,
                rate = 1
            }
        },
        orders = {
            active = {},
            completed = {}
        }
    }
end

-- Salva dati business (GLOBAL - used by modules)
function SaveBusinessData(businessId, data)
    MySQL.insert('INSERT INTO business_data (business_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?',
        { businessId, json.encode(data), json.encode(data) })
end

-- ============================================
-- CORE CALLBACKS
-- ============================================

lib.callback.register('zBusinessManager:server:login', function(source, businessId, username, password)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return { success = false, message = 'Invalid business' } end
    
    if business.credentials.username == username and business.credentials.password == password then
        return { success = true, data = GetBusinessData(businessId) }
    end
    return { success = false, message = 'Invalid credentials' }
end)

lib.callback.register('zBusinessManager:server:getBusinessData', function(source, businessId)
    return { success = true, data = GetBusinessData(businessId) }
end)

-- ============================================
-- MODULE SYSTEM CALLBACKS (Per-Module Passwords)
-- ============================================

-- Get enabled modules for a business
lib.callback.register('zBusinessManager:server:getEnabledModules', function(source, businessId)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return { success = false, modules = {} } end
    
    local enabledModules = {}
    
    -- Get business-specific module list (now a table with settings)
    local businessModules = business.modules or {}
    
    for moduleId, moduleSettings in pairs(businessModules) do
        local moduleConfig = Config.Modules[moduleId]
        if moduleConfig and moduleConfig.enabled then
            -- Check if module has a password
            local hasPassword = moduleSettings.password ~= nil and moduleSettings.password ~= ""
            
            table.insert(enabledModules, {
                id = moduleConfig.id,
                label = moduleConfig.label,
                icon = moduleConfig.icon,
                color = moduleConfig.color,
                requiresPassword = hasPassword
            })
        end
    end
    
    return { success = true, modules = enabledModules }
end)

-- Verify module password (now per-module)
lib.callback.register('zBusinessManager:server:verifyModulePassword', function(source, businessId, moduleId, password)
    local business = Config.BusinessDefinitions[businessId]
    if not business then return { success = false, message = 'Invalid business' } end
    
    -- Get module settings for this business
    local moduleSettings = business.modules[moduleId]
    if not moduleSettings then return { success = false, message = 'Module not found' } end
    
    -- Check if module has a password
    if not moduleSettings.password then
        return { success = true } -- No password required
    end
    
    -- Verify password
    if moduleSettings.password == password then
        return { success = true }
    end
    
    return { success = false, message = 'ACCESS DENIED' }
end)

-- ============================================
-- RESOURCE LIFECYCLE
-- ============================================

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
end)

print('^2[zBusinessManager] Server initialized successfully^0')

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
end)