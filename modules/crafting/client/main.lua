RegisterNetEvent('zBusinessManager:updateCraftQueue', function(businessId, queue)
    DUIManager.SendMessage(businessId, {
        action = 'updateQueue',
        queue = queue
    })
end)

RegisterCommand('openbusinessstash', function()
    -- For testing: open the first business terminal
    exports.ox_inventory:openInventory('stash', {
        id = "business_craft_stock",
        owner = "pipedown"
    })
end, false)

-- CRAFTING CALLBACKS
RegisterNUICallback('getCraftRecipes', function(data, cb)
    lib.callback('zBusinessManager:server:getCraftRecipes', false, function(result)
        cb(result)
    end, data.businessId)
end)

RegisterNUICallback('getCraftStock', function(data, cb)
    lib.callback('zBusinessManager:server:getCraftStock', false, function(result)
        cb(result)
    end, data.businessId)
end)

local last_craft = 0
RegisterNUICallback('startCraft', function(data, cb)
    local now = GetGameTimer()
    if now - last_craft < 500 then
        --print("Crafting request too soon")
        cb({ success = false, message = "Richiesta di crafting troppo veloce" })
        return
    end

    last_craft = now
    --print("Starting craft for item: " .. data.itemName)
    lib.callback('zBusinessManager:server:startCraft', false, function(result)
        cb(result)
    end, data.businessId, data.itemName)
end)

RegisterNUICallback('getCraftQueue', function(data, cb)
    lib.callback('zBusinessManager:server:getCraftQueue', false, function(result)
        cb(result)
    end, data.businessId)
end)

RegisterNUICallback('openCraftStash', function(data, cb)
    -- Disable focus so inventory can be interacted with
    SendNUIMessage({
        action = 'deactivate',
    })
    SetNuiFocus(false, false)

    lib.callback('zBusinessManager:server:openCraftStash', false, function(result)
        if result.success then
            -- Wait for inventory to open (timeout 2s)
            local timeout = 0
            while not LocalPlayer.state.invOpen and timeout < 2000 do
                Wait(100)
                timeout = timeout + 100
            end

            -- Wait for inventory to close
            if LocalPlayer.state.invOpen then
                while LocalPlayer.state.invOpen do
                    Wait(100)
                end
            end
        end

        -- Restore focus if terminal is still open
        if TerminalManager.isOpen then
            SetNuiFocus(true, false)
            SendNUIMessage({
                action = 'activate',
                dui = data.businessId
            })
        end

        cb(result)
    end, data.businessId)
end)
