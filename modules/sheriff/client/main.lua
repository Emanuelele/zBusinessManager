local ESX = exports["es_extended"]:getSharedObject()

-- NUI Callbacks

RegisterNUICallback('sheriff:getPlayersData', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:getPlayersData', false, function(result)
        cb(result)
    end, data.query)
end)

RegisterNUICallback('sheriff:searchVehicle', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:searchVehicle', false, function(result)
        print(json.encode(result))
        if result and result.found and result.coords then
            print("Vehicle found")
            local allowed = false
            for _, allowedVehicle in ipairs(Config.AllowedVehicles) do
                if tostring(result.model) == tostring(allowedVehicle) then
                    allowed = true
                    break
                end
            end
            print("Allowed: " .. tostring(allowed))

            if allowed then
                TriggerServerEvent('lele_needs:manageStress', GetPlayerServerId(PlayerId()), -5.0, 0)

                local blip = AddBlipForCoord(result.coords.x, result.coords.y, result.coords.z)
                SetBlipSprite(blip, 1)
                SetBlipColour(blip, 2)
                SetBlipScale(blip, 0.7)
                BeginTextCommandSetBlipName("STRING")
                AddTextComponentString("Vehicle: " .. data.plate)
                EndTextCommandSetBlipName(blip)

                Citizen.SetTimeout(300000, function()
                    if DoesBlipExist(blip) then
                        RemoveBlip(blip)
                    end
                end)
            end
        end
        cb(result)
    end, data.plate)
end)

RegisterNUICallback('sheriff:insertNote', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:insertNote', false, function(result)
        cb(result)
    end, data.identifier, data.note)
end)

-- ... (other callbacks remain same, just ensuring order)

-- Anklet Integration
RegisterNUICallback('sheriff:getAnklets', function(data, cb)
    -- Try server callback first if implemented, otherwise fallback to client bridge
    -- Since we implemented a placeholder on server, let's stick to the client bridge 
    -- which we know works from the old resource analysis
    ESX.TriggerServerCallback('lele_anklets:getAnklets', function(anklets)
        cb(anklets or {})
    end)
end)

RegisterNUICallback('sheriff:deleteNote', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:deleteNote', false, function(result)
        cb({ success = result })
    end, data.noteId)
end)

RegisterNUICallback('sheriff:insertCrime', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:insertCrime', false, function(result)
        cb(result)
    end, data.identifier, data.record)
end)

RegisterNUICallback('sheriff:deleteCrime', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:deleteCrime', false, function(result)
        cb({ success = result })
    end, data.crimeId)
end)

RegisterNUICallback('sheriff:insertComplaint', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:insertComplaint', false, function(result)
        cb(result)
    end, data.identifier, data.complaint)
end)

RegisterNUICallback('sheriff:deleteComplaint', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:deleteComplaint', false, function(result)
        cb({ success = result })
    end, data.complaintId)
end)

RegisterNUICallback('sheriff:insertFine', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:insertFine', false, function(result)
        cb(result)
    end, data.identifier, data.amount, data.reason)
end)

RegisterNUICallback('sheriff:deleteFine', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:deleteFine', false, function(result)
        cb({ success = result })
    end, data.fineId)
end)

RegisterNUICallback('sheriff:flagFinePaid', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:flagFinePaid', false, function(result)
        cb(result)
    end, data.fineId)
end)

RegisterNUICallback('sheriff:getUnpaidFines', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:getUnpaidFines', false, function(result)
        cb(result)
    end)
end)

RegisterNUICallback('sheriff:getExpiredFines', function(data, cb)
    lib.callback('zBusinessManager:server:sheriff:getExpiredFines', false, function(result)
        cb(result)
    end)
end)

RegisterNUICallback('sheriff:toggleAnnouncement', function(data, cb)
    TriggerServerEvent('zBusinessManager:server:sheriff:toggleAnnouncement')
    cb({})
end)

-- Anklet Integration
RegisterNUICallback('sheriff:getAnklets', function(data, cb)
    ESX.TriggerServerCallback('lele_anklets:getAnklets', function(anklets)
        cb(anklets or {})
    end)
end)

RegisterNUICallback('sheriff:localizePlayer', function(data, cb)
    local ankletId = data.ankletId
    if not ankletId then
        cb({ success = false, error = "Missing anklet id" })
        return
    end

    local serverId = tonumber(ankletId)
    if not serverId then
        cb({ success = false, error = "Invalid anklet id" })
        return
    end

    local targetPlayer = GetPlayerFromServerId(serverId)
    if not targetPlayer then
        cb({ success = false, error = "Player not found" })
        return
    end

    local targetPed = GetPlayerPed(targetPlayer)
    if not DoesEntityExist(targetPed) then
        cb({ success = false, error = "Player entity does not exist" })
        return
    end

    local pos = GetEntityCoords(targetPed)
    local blip = AddBlipForCoord(pos.x, pos.y, pos.z)
    TriggerServerEvent('lele_needs:manageStress', GetPlayerServerId(PlayerId()), -5.0, 0)
    SetBlipSprite(blip, 1)
    SetBlipColour(blip, 3)
    SetBlipScale(blip, 0.7)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString(data.name)
    EndTextCommandSetBlipName(blip)

    Citizen.SetTimeout(300000, function()
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end)

    cb({ success = true })
end)
