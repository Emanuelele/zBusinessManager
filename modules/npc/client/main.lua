-- NPC Management Client Module

RegisterNUICallback('zBusinessManager:server:hireCraftingNPC', function(data, cb)
    lib.callback('zBusinessManager:server:hireCraftingNPC', false, function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('zBusinessManager:server:getNPCStats', function(data, cb)
    lib.callback('zBusinessManager:server:getNPCStats', false, function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('zBusinessManager:server:upgradeNPC', function(data, cb)
    lib.callback('zBusinessManager:server:upgradeNPC', false, function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('zBusinessManager:server:payNPCWage', function(data, cb)
    lib.callback('zBusinessManager:server:payNPCWage', false, function(result)
        cb(result)
    end, data)
end)
