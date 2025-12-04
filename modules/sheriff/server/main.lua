local ESX = exports["es_extended"]:getSharedObject()
local xSound = exports["xsound"]
local CDN = exports["peakville_cdn"]

local announcementStarted = false

-- Utility function for date formatting
local function unixToDateString(msTimestamp)
    local timestamp = math.floor(msTimestamp / 1000)
    local t = os.date("*t", timestamp)
    return string.format("%02d/%02d/%04d", t.day, t.month, t.year)
end

-- Get Players Data (Citizens + Records)
-- Get Players Data (Citizens + Records) - Optimized Search
lib.callback.register('zBusinessManager:server:sheriff:getPlayersData', function(source, query)
    if not query or string.len(query) < 4 then return {} end
    
    local searchQuery = "%" .. query .. "%"
    local users = MySQL.query.await("SELECT identifier, firstname, lastname, dateofbirth, sex, height, weight, ethnicity, state, shoe_size, blood_group, criminal_convictions, phone_number FROM users WHERE firstname LIKE ? OR lastname LIKE ? OR dateofbirth LIKE ?", {searchQuery, searchQuery, searchQuery})
    
    if #users == 0 then return {} end

    local crimeRecords = MySQL.query.await("SELECT id, identifier, record, date FROM crime_records")
    local citizenNotes = MySQL.query.await("SELECT id, identifier, note, date FROM citizen_notes")
    local fines = MySQL.query.await("SELECT id, identifier, amount, reason, status, date FROM citizen_fines")
    local complaints = MySQL.query.await("SELECT id, identifier, complaint, date FROM citizen_complaints")

    local playersData = {}

    for _, user in pairs(users) do
        local crimes = {}
        for _, crime in pairs(crimeRecords) do
            if crime.identifier == user.identifier then
                table.insert(crimes, { id = crime.id, text = crime.record, date = unixToDateString(crime.date) })
            end
        end

        local notes = {}
        for _, note in pairs(citizenNotes) do
            if note.identifier == user.identifier then
                table.insert(notes, { id = note.id, text = note.note, date = unixToDateString(note.date) })
            end
        end

        local citizenFines = {}
        for _, fine in pairs(fines) do
            if fine.identifier == user.identifier then
                table.insert(citizenFines, { id = fine.id, amount = fine.amount, reason = fine.reason, date = unixToDateString(fine.date), status = fine.status })
            end
        end

        local citizenComplaints = {}
        for _, complaint in pairs(complaints) do
            if complaint.identifier == user.identifier then
                table.insert(citizenComplaints, { id = complaint.id, text = complaint.complaint, date = unixToDateString(complaint.date) })
            end
        end

        table.insert(playersData, {
            identifier = user.identifier,
            firstname = user.firstname,
            lastname = user.lastname,
            date_of_birth = user.dateofbirth,
            gender = user.sex,
            height = user.height,
            weight = user.weight,
            ethnicity = user.ethnicity,
            state = user.state,
            shoe_size = user.shoe_size,
            blood_group = user.blood_group,
            criminal_convictions = user.criminal_convictions,
            phone_number = user.phone_number,
            crimes = crimes,
            notes = notes,
            fines = citizenFines,
            complaints = citizenComplaints
        })
    end

    return playersData
end)

-- Vehicle Search
lib.callback.register('zBusinessManager:server:sheriff:searchVehicle', function(source, plate)
    if not plate then return nil end
    plate = string.upper(plate):gsub("%s+", "") -- Normalize plate

    local vehicles = GetAllVehicles()
    for _, veh in ipairs(vehicles) do
        local vehPlate = GetVehicleNumberPlateText(veh)
        if vehPlate then
            vehPlate = string.upper(vehPlate):gsub("%s+", "")
            if vehPlate == plate then
                local coords = GetEntityCoords(veh)
                local model = GetEntityModel(veh)
                -- Try to get owner from DB
                local owner = MySQL.scalar.await("SELECT owner FROM owned_vehicles WHERE plate = ?", {plate})
                local ownerName = "Sconosciuto"
                if owner then
                    local user = MySQL.single.await("SELECT firstname, lastname FROM users WHERE identifier = ?", {owner})
                    if user then ownerName = user.firstname .. " " .. user.lastname end
                end

                return {
                    found = true,
                    plate = plate,
                    model = model,
                    coords = coords,
                    owner = ownerName
                }
            end
        end
    end
    
    -- If not found in world, check DB only
    local dbVeh = MySQL.single.await("SELECT owner, vehicle FROM owned_vehicles WHERE plate = ?", {plate})
    if dbVeh then
         local user = MySQL.single.await("SELECT firstname, lastname FROM users WHERE identifier = ?", {dbVeh.owner})
         local ownerName = "Sconosciuto"
         if user then ownerName = user.firstname .. " " .. user.lastname end
         return {
            found = false, -- Not in world
            plate = plate,
            owner = ownerName
         }
    end

    return nil
end)

-- Anklets Integration
lib.callback.register('zBusinessManager:server:sheriff:getAnklets', function(source)
    -- This assumes lele_anklets has a server export or callback we can use. 
    -- Since we can't easily call another resource's callback from server-side without an export,
    -- we will rely on the client-side bridging for the actual data if this fails, 
    -- but here we provide a placeholder or try to use an export if available.
    -- However, the plan was to add a callback. 
    -- If lele_anklets doesn't have a server export, we might need to stick to client-side bridging.
    -- But let's assume we can query the DB or use an export.
    -- For now, returning nil to let client handle it or implement if we knew the export.
    return nil 
end)

-- Manage Notes
lib.callback.register('zBusinessManager:server:sheriff:insertNote', function(source, identifier, note)
    local insertedId = MySQL.insert.await("INSERT INTO citizen_notes (identifier, note, date) VALUES (?, ?, NOW())", {identifier, note})
    if insertedId then
        local result = MySQL.query.await("SELECT date FROM citizen_notes WHERE id = ?", {insertedId})
        return { success = true, id = insertedId, date = result[1] and unixToDateString(result[1].date) or nil }
    end
    return { success = false }
end)

lib.callback.register('zBusinessManager:server:sheriff:deleteNote', function(source, noteId)
    local result = MySQL.update.await("DELETE FROM citizen_notes WHERE id = ?", {noteId})
    return result > 0
end)

-- Manage Crimes
lib.callback.register('zBusinessManager:server:sheriff:insertCrime', function(source, identifier, record)
    local insertedId = MySQL.insert.await("INSERT INTO crime_records (identifier, record, date) VALUES (?, ?, NOW())", {identifier, record})
    if insertedId then
        local result = MySQL.query.await("SELECT date FROM crime_records WHERE id = ?", {insertedId})
        return { success = true, id = insertedId, date = result[1] and unixToDateString(result[1].date) or nil }
    end
    return { success = false }
end)

lib.callback.register('zBusinessManager:server:sheriff:deleteCrime', function(source, crimeId)
    local result = MySQL.update.await("DELETE FROM crime_records WHERE id = ?", {crimeId})
    return result > 0
end)

-- Manage Complaints
lib.callback.register('zBusinessManager:server:sheriff:insertComplaint', function(source, identifier, complaint)
    local insertedId = MySQL.insert.await("INSERT INTO citizen_complaints (identifier, complaint, date) VALUES (?, ?, NOW())", {identifier, complaint})
    if insertedId then
        local result = MySQL.query.await("SELECT date FROM citizen_complaints WHERE id = ?", {insertedId})
        return { success = true, id = insertedId, date = result[1] and unixToDateString(result[1].date) or nil }
    end
    return { success = false }
end)

lib.callback.register('zBusinessManager:server:sheriff:deleteComplaint', function(source, complaintId)
    local result = MySQL.update.await("DELETE FROM citizen_complaints WHERE id = ?", {complaintId})
    return result > 0
end)

-- Manage Fines
lib.callback.register('zBusinessManager:server:sheriff:insertFine', function(source, identifier, amount, reason)
    local insertedId = MySQL.insert.await("INSERT INTO citizen_fines (identifier, amount, reason, date) VALUES (?, ?, ?, NOW())", {identifier, amount, reason})
    if insertedId then
        local result = MySQL.query.await("SELECT date FROM citizen_fines WHERE id = ?", {insertedId})
        return { success = true, id = insertedId, date = result[1] and unixToDateString(result[1].date) or nil }
    end
    return { success = false }
end)

lib.callback.register('zBusinessManager:server:sheriff:deleteFine', function(source, fineId)
    local result = MySQL.update.await("DELETE FROM citizen_fines WHERE id = ?", {fineId})
    return result > 0
end)

lib.callback.register('zBusinessManager:server:sheriff:flagFinePaid', function(source, fineId)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return { success = false, message = "Giocatore non trovato" } end

    local fine = MySQL.single.await("SELECT amount FROM citizen_fines WHERE id = ?", {fineId})
    if not fine then return { success = false, message = "Multa non trovata" } end
    
    local amount = tonumber(fine.amount)
    local playerMoney = xPlayer.getMoney()
    
    print("DEBUG: Paying fine. Money: " .. tostring(playerMoney) .. " ("..type(playerMoney)..") | Amount: " .. tostring(amount) .. " ("..type(amount)..")")
    
    if playerMoney >= amount then
        print("DEBUG: Check PASSED. Removing money...")
        xPlayer.removeMoney(amount)
        
        -- Add to Business Vault
        if Config.Bank and Config.Bank.business_vaults and Config.Bank.business_vaults.sheriff then
            local stashId = Config.Bank.business_vaults.sheriff.stash_id
            if stashId then
                -- register stash
                TriggerEvent("Peakville:Safe:RegisterStash", stashId, Config.Bank.business_vaults.sheriff.coords, Config.Bank.business_vaults.sheriff.label)
                exports.ox_inventory:AddItem(stashId, 'money', amount)
                print("DEBUG: Added " .. amount .. " to stash " .. stashId)
            end
        end

        local result = MySQL.update.await("UPDATE citizen_fines SET status = 'Pagata' WHERE id = ?", {fineId})
        return { success = result > 0, message = "Multa pagata con successo" }
    else
        print("DEBUG: Check FAILED. Insufficient funds.")
        return { success = false, message = "Non hai abbastanza soldi contanti" }
    end
end)

lib.callback.register('zBusinessManager:server:sheriff:getUnpaidFines', function(source)
    local fines = MySQL.query.await([[
        SELECT cf.id, cf.identifier, cf.amount, cf.reason, cf.date, u.firstname, u.lastname 
        FROM citizen_fines cf
        JOIN users u ON cf.identifier = u.identifier
        WHERE cf.status IS NULL OR cf.status != 'Pagata'
        ORDER BY cf.date DESC
    ]])
    
    local result = {}
    for _, fine in pairs(fines) do
        table.insert(result, {
            id = fine.id,
            firstname = fine.firstname,
            lastname = fine.lastname,
            amount = fine.amount,
            reason = fine.reason,
            date = unixToDateString(fine.date)
        })
    end
    return result
end)

lib.callback.register('zBusinessManager:server:sheriff:getExpiredFines', function(source)
    local sevenDaysAgo = os.time() - (7 * 24 * 60 * 60)
    local fines = MySQL.query.await([[
        SELECT cf.id, cf.identifier, cf.amount, cf.reason, cf.date, u.firstname, u.lastname 
        FROM citizen_fines cf
        JOIN users u ON cf.identifier = u.identifier
        WHERE (cf.status IS NULL OR cf.status != 'Pagata')
        AND cf.date < ?
        ORDER BY cf.date DESC
    ]], {sevenDaysAgo * 1000})
    
    local result = {}
    for _, fine in pairs(fines) do
        table.insert(result, {
            id = fine.id,
            firstname = fine.firstname,
            lastname = fine.lastname,
            amount = fine.amount,
            reason = fine.reason,
            date = unixToDateString(fine.date)
        })
    end
    return result
end)

-- Announcement Logic
RegisterNetEvent("zBusinessManager:server:sheriff:toggleAnnouncement", function()
    announcementStarted = not announcementStarted

    if announcementStarted then
        xSound:PlayUrlPos(-1, "sheriff_announcement", CDN:GetStaticUrl("terminal/blackout_siren.ogg"), 0.6, vec3(-443.9271, 6003.2588, 44.6044), true)
        xSound:Distance(-1, "sheriff_announcement", 1000.0)
    else
        xSound:Destroy(-1, "sheriff_announcement")
    end
end)
