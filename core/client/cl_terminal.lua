-- Terminal Interaction Module

TerminalManager = {}

TerminalManager.activeBusiness = nil
TerminalManager.activeCam = nil
TerminalManager.isOpen = false
TerminalManager.interactionThread = nil

function TerminalManager.Open(businessId)
    local business = Config.BusinessDefinitions[businessId]
    if not business or not business.terminal then return end

    if TerminalManager.isOpen then return end

    TerminalManager.isOpen = true
    TerminalManager.activeBusiness = businessId

    -- Invia messaggio alla DUI
    DUIManager.SendMessage(businessId, {
        action = 'open',
        business = businessId,
        businessLabel = business.label
    })

    -- Attiva il bridge NUI per catturare input e inoltrarli alla DUI
    SetNuiFocus(true, false)

    SendNUIMessage({
        action = 'activate',
        dui = businessId
    })

    -- Setup camera e interazione
    local duiBusiness = DUIManager.businesses[businessId]
    if duiBusiness and DoesEntityExist(duiBusiness.prop) then
        TerminalManager.SetupCamera(duiBusiness.prop)
        TerminalManager.StartInteraction(duiBusiness)
    end
    TriggerServerEvent('zBusinessManager:server:openTerminal', businessId)
    print("^2[Terminal] Opened for " .. businessId)
end

function TerminalManager.Close()
    if TerminalManager.interactionThread then
        TerminalManager.interactionThread = nil
    end
    TriggerServerEvent('zBusinessManager:server:closeTerminal', TerminalManager.activeBusiness)
    if TerminalManager.activeCam then
        RenderScriptCams(false, true, 500, true, true)
        DestroyCam(TerminalManager.activeCam, false)
        TerminalManager.activeCam = nil
    end

    if TerminalManager.activeBusiness then
        DUIManager.SendMessage(TerminalManager.activeBusiness, { action = 'close' })
    end

    -- Disattiva il bridge NUI
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'deactivate'
    })

    TerminalManager.isOpen = false
    TerminalManager.activeBusiness = nil

    --print("^2[Terminal] Closed")
end

function TerminalManager.SetupCamera(prop)
    if not TerminalManager.activeCam then
        TerminalManager.activeCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    end

    local camPos = GetOffsetFromEntityInWorldCoords(prop, 0.0, -0.25, 0.13)
    SetCamCoord(TerminalManager.activeCam, camPos.x, camPos.y, camPos.z)
    PointCamAtEntity(TerminalManager.activeCam, prop, 0.0, 0.0, 0.085, true)
    SetCamFov(TerminalManager.activeCam, 60.0)
    SetCamActive(TerminalManager.activeCam, true)
    RenderScriptCams(true, true, 500, true, true)
end

function TerminalManager.StartInteraction(duiBusiness)
    if TerminalManager.interactionThread then return end

    local dui = duiBusiness.dui
    
    TerminalManager.interactionThread = CreateThread(function()
        local lastCursorUpdate = 0
        local lastClickUpdate = 0
        while TerminalManager.isOpen do
            Wait(0)
            
            local mouseX
            local mouseY
            if not LocalPlayer.state.invOpen then 
                -- Disabilita controlli
                DisableAllControlActions(0)
                EnableControlAction(0, 1, true)   -- Mouse X
                EnableControlAction(0, 2, true)   -- Mouse Y
                EnableControlAction(0, 322, true) -- ESC (fallback se React non lo cattura)
                -- Usa posizione cursore nativo (molto più semplice!)
                local cursorX, cursorY = GetNuiCursorPosition()
                local screenW, screenH = GetActiveScreenResolution()

                -- Normalizza (0.0 - 1.0)
                local normalizedX = cursorX / screenW
                local normalizedY = cursorY / screenH

                -- Converti in coordinate pixel DUI (1920x1080)
                mouseX = math.floor(normalizedX * 1920*1.1)
                mouseY = math.floor(normalizedY * 1080*1.1)

                -- Clamp
                mouseX = math.max(0, math.min(1919*1.1, mouseX))
                mouseY = math.max(0, math.min(1079*1.1, mouseY))

                -- Invia posizione cursore alla DUI (Throttled ~30fps)
                local currentTime = GetGameTimer()
                if currentTime - lastCursorUpdate > 5 then
                    dui:sendMessage({
                        action = 'cursorMove',
                        data = { x = mouseX, y = mouseY }
                    })
                    lastCursorUpdate = currentTime
                end

                -- Click sinistro (simula click tramite document.elementFromPoint)
                if currentTime - lastClickUpdate > 150 then
                    if IsDisabledControlJustPressed(0, 24) then
                        dui:sendMessage({
                            action = 'click',
                            data = { x = mouseX, y = mouseY }
                        })
                        lastClickUpdate = currentTime
                    end
                end

                -- ESC per chiudere (fallback se React non lo cattura)
                -- Ignora se l'inventario è aperto
                if IsDisabledControlJustPressed(0, 322) and not LocalPlayer.state.invOpen then
                    TerminalManager.Close()
                end

            end
            if IsDisabledControlJustPressed(0, 322) and LocalPlayer.state.invOpen then
                exports.ox_inventory:closeInventory()
            end
        end

        TerminalManager.interactionThread = nil
    end)
end

-- Event handlers
RegisterNetEvent('zBusinessManager:client:useTerminal', function(data)
    TerminalManager.Open(data.business)
end)

RegisterNetEvent('zBusinessManager:notify', function(type, message)
    if TerminalManager.isOpen and TerminalManager.activeBusiness then
        DUIManager.SendMessage(TerminalManager.activeBusiness, {
            action = 'notification',
            type = type,
            message = message
        })
    end
end)

-- NUI Callbacks per business logic (chiamati dalla DUI React)
RegisterNUICallback('close', function(_, cb)
    if LocalPlayer.state.invOpen then return end
    TerminalManager.Close()
    cb('ok')
end)

-- -- Callback dal bridge NUI per inoltrare input alla DUI
RegisterNUICallback('bridgeKeyPress', function(data, cb)
    if TerminalManager.isOpen and TerminalManager.activeBusiness then
        -- Inoltra il keypress alla DUI
        DUIManager.SendMessage(TerminalManager.activeBusiness, {
            action = 'keypress',
            data = data
        })
    end
    cb('ok')
end)

-- Callback per gestire il paste dal bridge
RegisterNUICallback('bridgePaste', function(data, cb)
    if TerminalManager.isOpen and TerminalManager.activeBusiness then
        -- Inoltra il testo incollato alla DUI
        DUIManager.SendMessage(TerminalManager.activeBusiness, {
            action = 'paste',
            data = { text = data.text }
        })
    end
    cb('ok')
end)

-- Callback per gestire lo scroll dal bridge
RegisterNUICallback('bridgeScroll', function(data, cb)
    if TerminalManager.isOpen and TerminalManager.activeBusiness then
        -- Inoltra evento scroll alla DUI
        DUIManager.SendMessage(TerminalManager.activeBusiness, {
            action = 'scroll',
            data = {
                deltaX = data.deltaX,
                deltaY = data.deltaY,
                deltaZ = data.deltaZ or 0,
                deltaMode = data.deltaMode or 0
            }
        })
    end
    cb('ok')
end)

RegisterNUICallback('login', function(data, cb)
    print("[DEBUG] NUI Callback 'login' received")
    lib.callback('zBusinessManager:server:login', false, function(result)
        print("[DEBUG] Server login result:", json.encode(result))
        cb(result)
    end, data.businessId, data.username, data.password)
end)

RegisterNUICallback('log', function(data, cb)
    print(data.message)
    cb('ok')
end)

RegisterNUICallback('getBusinessData', function(data, cb)
    lib.callback('zBusinessManager:server:getBusinessData', false, function(result)
        cb(result)
    end, data.businessId)
end)

-- Generic NUI Callback Handler (for module system)
RegisterNUICallback('nuiCallback', function(data, cb)
    local eventName = data.eventName
    local args = data.args or {}
    
    print("^3[NUI Callback] Event: " .. eventName .. "^0")
    print("^3[NUI Callback] Args: " .. json.encode(args) .. "^0")
    
    -- Call server callback with dynamic event name
    lib.callback(eventName, false, function(result)
        print("^2[NUI Callback] Result: " .. json.encode(result) .. "^0")
        cb(result)
    end, table.unpack(args))
end)




-- OLD CRAFTING (deprecated)
RegisterNUICallback('startCrafting', function(data, cb)
    lib.callback('zBusinessManager:server:startCrafting', false, function(result)
        cb(result)
    end, data.businessId, data.itemId)
end)

RegisterNUICallback('hireNPC', function(data, cb)
    lib.callback('zBusinessManager:server:hireNPC', false, function(result)
        cb(result)
    end, data.businessId)
end)

RegisterNUICallback('upgradeNPC', function(data, cb)
    lib.callback('zBusinessManager:server:upgradeNPC', false, function(result)
        cb(result)
    end, data.businessId, data.npcId, data.upgradeType)
end)

RegisterNUICallback('upgradeCleaning', function(data, cb)
    lib.callback('zBusinessManager:server:upgradeCleaning', false, function(result)
        cb(result)
    end, data.businessId, data.upgradeType)
end)

RegisterNUICallback('getOrders', function(data, cb)
    lib.callback('zBusinessManager:server:getOrders', false, function(result)
        cb(result)
    end, data.businessId)
end)


RegisterNetEvent("zBusinessManager:client:syncStock", function(stock)
    --print("Syncing stock for business: " .. TerminalManager.activeBusiness)
    DUIManager.SendMessage(TerminalManager.activeBusiness, {
        action = 'syncStock',
        stock = stock
    })
end)



return TerminalManager
