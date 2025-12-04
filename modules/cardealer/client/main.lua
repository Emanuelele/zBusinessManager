RegisterNUICallback('cardealer:getVehiclesOfDay', function(data, cb)
    lib.callback('cardealer:getVehiclesOfDay', false, function(result)
        cb(result)
    end)
end)

RegisterNUICallback('cardealer:bookVehicle', function(data, cb)
    lib.callback('cardealer:bookVehicle', false, function(result)
        if not result.available then
            print("ao1")
            cb({ success = false, message = result.message })
            return
        end
        
        local success = exports['lele_cardealer']:addCarToOrder(data.vehicleModel, data.price)
        
        if success then
            print("ao2")
            cb({ 
                success = true, 
                message = string.format("%s richiesta accettata, il ritiro sarà disponibile tra 1 ora.", data.vehicleModel:upper())
            })
        else
            print("ao3")
            cb({ success = false, message = "Errore durante la prenotazione del veicolo" })
        end
    end, data)
end)