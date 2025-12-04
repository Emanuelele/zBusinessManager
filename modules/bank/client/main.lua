local function registerBankCallback(name)
    RegisterNUICallback(name, function(data, cb)
        
        lib.callback(name, false, function(result)
            if not result then
                print("^1[zBusinessManager] Callback failed or returned nil: " .. name .. "^0")
                cb({ success = false, message = "Errore comunicazione server" })
            else
                cb(result)
            end
        end, data)
    end)
end

-- Register all bank module callbacks
local callbacks = {
    'zBusinessManager:server:bank:getSafeRegistry',
    'zBusinessManager:server:bank:assignSafe',
    'zBusinessManager:server:bank:revokeSafe',
    'zBusinessManager:server:bank:renewSafe',
    'zBusinessManager:server:payroll:printPayslip',
    'zBusinessManager:server:payroll:getPayslips',
    'zBusinessManager:server:payroll:revokePayslip'
}

for _, name in ipairs(callbacks) do
    registerBankCallback(name)
end

-- Notification event
RegisterNetEvent('zBusinessManager:client:bank:notify', function(msg, type)
    lib.notify({
        title = 'Banca',
        description = msg,
        type = type or 'inform'
    })
end)




