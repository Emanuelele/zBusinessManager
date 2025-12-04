-- Main Client Entry Point


-- Initialize all businesses
CreateThread(function()
    Wait(1000)

    --print("^2[zBusinessManager] Initializing businesses...")

    for businessId, businessData in pairs(Config.BusinessDefinitions) do
        -- Create DUI for business
            local point = lib.points.new({
                coords = businessData.terminal.coords,
                distance = 20,
            })

             
            function point:onEnter()
                DUIManager.Create(businessId, businessData)
            end
            function point:onExit()
                DUIManager.Remove(businessId)
            end
 
        -- Setup ox_target interaction
        exports.ox_target:addModel(businessData.terminal.prop_model, {
            {
                name = 'use_business_terminal_' .. businessId,
                event = 'zBusinessManager:client:useTerminal',
                icon = 'fa-solid fa-computer',
                label = 'Use Terminal',
                business = businessId,
                canInteract = function(entity)
                    return #(GetEntityCoords(entity) - businessData.terminal.coords) < 2.5
                end
            }
        })

        -- load animdict 
        if businessData.craftnpc then
            RequestAnimDict(businessData.craftnpc.anim_on_craft.dict)
            while not HasAnimDictLoaded(businessData.craftnpc.anim_on_craft.dict) do
                Wait(10)
            end

            RequestAnimDict(businessData.craftnpc.animIdle.dict)
            while not HasAnimDictLoaded(businessData.craftnpc.animIdle.dict) do
                Wait(10)
            end
        end
    end

    --print("^2[zBusinessManager] Initialization complete!")
end)

-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    DUIManager.RemoveAll()
end)
-- Main Client Entry Point



-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    DUIManager.RemoveAll()
    TerminalManager.Close()

    --print("^2[zBusinessManager] Cleanup complete")
end)

-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    DUIManager.RemoveAll()
end)
-- Main Client Entry Point



-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    DUIManager.RemoveAll()
    TerminalManager.Close()

    --print("^2[zBusinessManager] Cleanup complete")
end)