local function getSafeRegistry()
    local result = MySQL.query.await('SELECT * FROM business_safe_registry')
    local registry = {}
    local now = os.time()
    local renewalInterval = Config.Bank.RenewalInterval or (30 * 24 * 60 * 60)

    for _, row in ipairs(result) do
        local lastRenewed = row.last_renewed_at and math.floor(row.last_renewed_at / 1000) or 0
        local assignedAt = row.assigned_at and math.floor(row.assigned_at / 1000) or 0
        
        local isExpired = (now - lastRenewed) > renewalInterval
        local expiresAt = lastRenewed + renewalInterval
        
        table.insert(registry, {
            id = row.id,
            safe_id = row.safe_id,
            owner_name = row.owner_name,
            owner_doc = row.owner_doc,
            assigned_at = assignedAt,
            last_renewed_at = lastRenewed,
            expires_at = expiresAt,
            isExpired = isExpired
        })
    end
    return registry
end

lib.callback.register('zBusinessManager:server:bank:getSafeRegistry', function(source, businessId)
    local safeList = Config.Bank and Config.Bank.SafeList or {}
    print("[DEBUG] getSafeRegistry called. SafeList count:", #safeList)
    if not Config.Bank then print("[DEBUG] Config.Bank is NIL!") end
    
    return { success = true, registry = getSafeRegistry(), safeList = safeList }
end)

lib.callback.register('zBusinessManager:server:bank:assignSafe', function(source, data)
    local businessId = data.businessId

    -- Check duplicate
    local existing = MySQL.scalar.await('SELECT count(*) FROM business_safe_registry WHERE safe_id = ?', { data.safeId })
    if existing > 0 then
        return { success = false, message = "Cassetta già assegnata" }
    end


    local id = MySQL.insert.await('INSERT INTO business_safe_registry (safe_id, owner_name, owner_doc, assigned_at, last_renewed_at) VALUES (?, ?, ?, NOW(), NOW())', {
        data.safeId, data.ownerName, data.ownerDoc
    })

    if id then
        return { success = true, message = "Cassetta assegnata con successo" }
    else
        return { success = false, message = "Errore database" }
    end
end)

lib.callback.register('zBusinessManager:server:bank:revokeSafe', function(source, safeId)
    print("[DEBUG] revokeSafe called. SafeId:", safeId)
    local affected = MySQL.update.await('DELETE FROM business_safe_registry WHERE safe_id = ?', { safeId })
    if affected > 0 then
        -- Optionally clear the stash content here?
        -- exports.ox_inventory:ClearInventory("safe_"..safeId) -- Hypothetical
        return { success = true, message = "Assegnazione revocata" }
    else
        return { success = false, message = "Errore revoca" }
    end
end)

lib.callback.register('zBusinessManager:server:bank:renewSafe', function(source, safeId)
    local affected = MySQL.update.await('UPDATE business_safe_registry SET last_renewed_at = NOW() WHERE safe_id = ?', { safeId })
    if affected > 0 then
        return { success = true, message = "Cassetta rinnovata" }
    else
        return { success = false, message = "Errore rinnovo" }
    end
end)

-- PAYROLL SYSTEM
lib.callback.register('zBusinessManager:server:payroll:printPayslip', function(source, data)
    local businessId = data.businessId
    local business = Config.BusinessDefinitions[businessId]
    local businessLabel = business and business.label or businessId
    
    -- Generate Unique ID
    local payslipId = string.format("%s-%s-%d", businessId, os.date("%Y%m%d"), math.random(1000, 9999))
    -- Ideally use a proper UUID, but this is sufficient for now and readable
    
    local success = MySQL.insert.await('INSERT INTO business_payslips (id, business_id, beneficiary, amount, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())', {
        payslipId, businessId, data.name .. " " .. data.surname, data.amount, 'active'
    })

    if not success then
        return { success = false, message = "Errore database" }
    end

    local info = {
        description = string.format("Beneficiario: %s %s\nImporto: $%s\nEmesso da: %s\nID: %s", data.name, data.surname, data.amount, businessLabel, payslipId),
        beneficiary = data.name .. " " .. data.surname,
        amount = tonumber(data.amount),
        document = data.document,
        issuer = businessLabel,
        issuerId = businessId,
        payslipId = payslipId, -- Unique ID for revocation/validation
        date = os.date("%d/%m/%Y %H:%M")
    }

    if exports.ox_inventory:CanCarryItem(source, 'payslip', 1) then
        exports.ox_inventory:AddItem(source, 'payslip', 1, info)
        return { success = true, message = "Cedolino stampato" }
    else
        -- Rollback (delete the entry if item cannot be given)
        MySQL.query('DELETE FROM business_payslips WHERE id = ?', { payslipId })
        return { success = false, message = "Inventario pieno" }
    end
end)

lib.callback.register('zBusinessManager:server:payroll:getPayslips', function(source, businessId)
    local results = MySQL.query.await('SELECT * FROM business_payslips WHERE business_id = ? ORDER BY created_at DESC', { businessId })
    
    -- Convert timestamps for UI
    for _, row in ipairs(results) do
        row.created_at = row.created_at and math.floor(row.created_at / 1000) or 0
    end
    
    return { success = true, payslips = results }
end)

lib.callback.register('zBusinessManager:server:payroll:revokePayslip', function(source, payslipId)
    local affected = MySQL.update.await('DELETE FROM business_payslips WHERE id = ?', { payslipId })
    if affected > 0 then
        return { success = true, message = "Cedolino revocato" }
    else
        return { success = false, message = "Errore revoca" }
    end
end)
