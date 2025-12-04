local vehiclesOfDay = {}

local function addValueToTable(tbl, value)
    for _, v in ipairs(tbl) do
        if v == value then
            return false
        end
    end
    table.insert(tbl, value)
    return true
end

local function generateVehiclesOfDay()
    vehiclesOfDay = {}
    local totalVehicles = #Config.Cardealer.Vehicles
    
    local cavallos2Index = nil
    for i, vehicle in ipairs(Config.Cardealer.Vehicles) do
        if vehicle.name == "cavallos2" then
            cavallos2Index = i
            break
        end
    end
    
    if cavallos2Index then
        table.insert(vehiclesOfDay, cavallos2Index)
    end
    
    while #vehiclesOfDay < 15 do
        local randomId = math.random(1, totalVehicles)
        addValueToTable(vehiclesOfDay, randomId)
    end
    
    return vehiclesOfDay
end

CreateThread(function()
    Wait(1000)
    generateVehiclesOfDay()
    print("[CARDEALER] Veicoli del giorno generati: " .. #vehiclesOfDay)
end)

CreateThread(function()
    while true do
        Wait(24 * 60 * 60 * 1000)
        generateVehiclesOfDay()
        print("[CARDEALER] Veicoli del giorno rigenerati")
    end
end)

lib.callback.register('cardealer:getVehiclesOfDay', function(source)
    local vehicles = {}
    for i, vehicle in ipairs(Config.Cardealer.Vehicles) do
        table.insert(vehicles, {
            id = i,
            name = vehicle.name,
            price = vehicle.price,
            categoria = vehicle.category
        })
    end
    
    local categories = {}
    for _, cat in ipairs(Config.Cardealer.Categories) do
        table.insert(categories, {
            id = cat.id,
            name = cat.name
        })
    end
    
    return {
        vehicles = vehicles,
        categories = categories,
        vehiclesOfDay = vehiclesOfDay
    }
end)

lib.callback.register('cardealer:bookVehicle', function(source, data)
    local vehicleModel = data.vehicleModel
    
    local vehicleIndex = nil
    for i, vehicle in ipairs(Config.Cardealer.Vehicles) do
        if vehicle.name == vehicleModel then
            vehicleIndex = i
            break
        end
    end
    
    if not vehicleIndex then
        return { available = false, message = "Veicolo non trovato" }
    end
    
    local isAvailable = false
    for _, id in ipairs(vehiclesOfDay) do
        if id == vehicleIndex then
            isAvailable = true
            break
        end
    end
    
    if not isAvailable then
        return { available = false, message = "Questo veicolo non è disponibile oggi" }
    end
    
    return { available = true, message = "Veicolo disponibile" }
end)