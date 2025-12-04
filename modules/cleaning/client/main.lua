DIRT_POINTS = {}
local LocalUpgrades = {}

RegisterNetEvent("zBusinessManager:client:updateUpgrades", function(businessKey, upgrades)
    LocalUpgrades = upgrades or {}
end)



AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then
        return
    end
    -- Pulizia eventuali marker o oggetti creati

    for k, point in pairs(DIRT_POINTS) do
        if DoesEntityExist(point.entity) then
            DeleteEntity(point.entity)
            point.entity = nil
        end
        point:remove()
    end
end)

RegisterCommand("pulisci", function()

    local minDist = nil
    local closestPoint = nil
    for k, point in pairs(DIRT_POINTS) do
        currentDistance = point.currentDistance
        if not minDist or currentDistance < minDist then
            minDist = currentDistance
            closestPoint = point
        end
    end
    if minDist and minDist > 2.0 then
        return
    end

    -- Calcola durata e raggio in base agli upgrade
    local efficiencyLevel = LocalUpgrades.efficiency or 1
    local upgradeData = Config.CleaningUpgrades.efficiency.levels[efficiencyLevel]
    local duration = 5000 * (upgradeData.value or 1.0)
    local cleanCount = upgradeData.count or 1

    -- Trova altri punti vicini se l'upgrade lo permette
    local pointsToClean = { closestPoint }
    if cleanCount > 1 then
        -- Crea una lista di punti candidati con distanza
        local candidates = {}
        for k, point in pairs(DIRT_POINTS) do
            if point ~= closestPoint and point.currentDistance <= 3.0 then
                table.insert(candidates, {point = point, distance = point.currentDistance})
            end
        end
        
        -- Ordina per distanza (più vicini prima)
        table.sort(candidates, function(a, b) return a.distance < b.distance end)
        
        -- Prendi i più vicini fino al limite
        for i = 1, math.min(#candidates, cleanCount - 1) do
            table.insert(pointsToClean, candidates[i].point)
        end
    end

        local result = lib.progressCircle({
            duration = duration,
            label = 'Cleaning dirt...',
            useWhileDead = false,
            canCancel = true,
            disable = {
                move = true,
                combat = true,
                car = true
            },
            anim = {

                dict = "anim@amb@drug_field_workers@rake@male_b@base",
                clip = "base",
                flag = 49
            },
            prop = {
                model = "prop_tool_broom",
                bone = 28422,
                        
                pos = vec3(-0.0100,
                0.0400,
                -0.0300),
                rot = vec3(0.0, 0.0, 0.0),
            }
        })
        if not result then
            --print("Pulizia annullata.")
            return
        end
    
    -- Rimuovi tutti i punti trovati e raccogli gli ID
    local cleanedIDs = {}
    for _, point in ipairs(pointsToClean) do
        if point then
            point:onExit()
            point:remove()
            DIRT_POINTS[point.ID] = nil
            table.insert(cleanedIDs, point.ID)
        end
    end
    
    -- Invia un unico evento batch al server
    if #cleanedIDs > 0 then
        TriggerServerEvent("zBusinessManager:removeDirtPoints", cleanedIDs)
    end
end)

RegisterNetEvent("zBusinessManager:removeDirtPoint", function(ID)
    if DIRT_POINTS[ID] then
        DIRT_POINTS[ID]:onExit()
        DIRT_POINTS[ID]:remove()
        DIRT_POINTS[ID] = nil
    end
end)
RegisterNetEvent("zBusinessManager:removeDirtPoints", function(IDs)
    for _, ID in ipairs(IDs) do
        if DIRT_POINTS[ID] then
            DIRT_POINTS[ID]:onExit()
            DIRT_POINTS[ID]:remove()
            DIRT_POINTS[ID] = nil
        end
    end
end)
AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then
        return
    end

        RequestAnimDict("anim@amb@drug_field_workers@rake@male_b@base")
    while not HasAnimDictLoaded("anim@amb@drug_field_workers@rake@male_b@base") do
        Citizen.Wait(100)
    end
    for k, v in pairs(Config.BusinessDefinitions) do
        if v.zone then
            local zone = lib.zones.poly({
                name = k .. "_zone",
                points = v.zone.points,
                thickness = v.zone.thickness,
                debug = Config.Debug or false,
                debugColour = { r = 0, g = 0, b = 255, a = 100 },
                onEnter = function(self)
                    TriggerServerEvent("zBusinessManager:playerEnteredBusinessZone", k)
                    --print("Entered zone: " .. k)
                end,
                onExit = function(self)
                    TriggerServerEvent("zBusinessManager:playerExitedBusinessZone", k)
                    --print("Exited zone: " .. k)
                end,
            })
            v.zone = zone
            local blacklistZones = {}
            for i, blZoneDef in pairs(v.blacklist_zones or {}) do
                local blZone = lib.zones.box({
                    name = k .. "_bl_zone_" .. i,
                    coords = blZoneDef.coords,
                    size = blZoneDef.size,
                    rotation = blZoneDef.rotation,
                    debug = Config.Debug or false,
                    debugColour = { r = 255, g = 0, b = 0, a = 100 },
                })
                table.insert(blacklistZones, blZone)
            end
            v.blacklist_zones = blacklistZones
        end
    end
end)

AddEventHandler("onPlayer")

function GetRandomCoordsInZone(zone, blacklistZones)
    local minX, maxX = math.huge, -math.huge
    local minY, maxY = math.huge, -math.huge
    local minZ, maxZ = math.huge, -math.huge

    for _, point in pairs(zone.points) do
        if point.x < minX then minX = point.x end
        if point.x > maxX then maxX = point.x end
        if point.y < minY then minY = point.y end
        if point.y > maxY then maxY = point.y end
        if point.z < minZ then minZ = point.z end
        if point.z > maxZ then maxZ = point.z end
    end
    local maxAttempts = 100
    for i = 1, maxAttempts do
        local x = math.random() * (maxX - minX) + minX
        local y = math.random() * (maxY - minY) + minY
        local z = math.random() * (maxZ - minZ) + minZ
        local testVec = vec3(x, y, z)

        if zone:contains(testVec) then
            local isInBlacklist = false
            if blacklistZones then
                for _, blZone in pairs(blacklistZones) do
                    if blZone:contains(testVec) then
                        isInBlacklist = true
                        break
                    end
                end
            end
            if isInBlacklist then
                goto continue
            end
            return vector3(x, y, z)
        end
        ::continue::
    end
    return nil
end

RegisterNetEvent("zBusinessManager:syncDirt", function(businessKey, dirt_table)
    for k, v in pairs(dirt_table) do
        local point = lib.points.new({
            id = "dirt_" .. businessKey .. "_" .. k,
            ID = "dirt_" .. businessKey .. "_" .. k,
            prop = v.prop,
            coords = vector3(v.coords.x, v.coords.y, v.coords.z),
            distance = 20.0,
        })
        function point:onEnter()
            local model = self.prop
            if not DoesEntityExist(self.entity) then
                RequestModel(GetHashKey(model))
                while not HasModelLoaded(GetHashKey(model)) do
                    Citizen.Wait(100)
                end

                local object = CreateObject(GetHashKey(model), self.coords.x, self.coords.y, self.coords.z, false, false,
                    false)

                -- ✔ FIX AUTOMATICO se tocca blacklist
                FixObjectPosition(object, Config.BusinessDefinitions[businessKey].blacklist_zones, 30,
                    Config.BusinessDefinitions[businessKey].zone)
                PlaceObjectOnGroundProperly(object)
                --force float
                -- float casuale tra 0.0 e 360.0
                local randomHeading = math.random() * 360.0

                SetEntityHeading(object, randomHeading)
                FreezeEntityPosition(object, true)
                self.entity = object
            end
        end

        function point:onExit()
            if DoesEntityExist(self.entity) then
                DeleteEntity(self.entity)
                self.entity = nil
            end
        end

        DIRT_POINTS["dirt_" .. businessKey .. "_" .. k] = point
    end
end)

function FixObjectPosition(object, blacklistZones, maxAttempts, zone)
    maxAttempts = maxAttempts or 30

    for attempt = 1, maxAttempts do
        local corners = GetOBBCorners(object)
        local invalid = false

        -- 🔍 1. CONTROLLA SE I CORNER SONO DENTRO LA ZONA PRINCIPALE
        for _, corner in ipairs(corners) do
            if not zone:contains(corner) then
                invalid = true
                break
            end
        end

        -- 🔍 2. CONTROLLA BLACKLIST
        if not invalid then
            for _, blZone in pairs(blacklistZones or {}) do
                for _, corner in ipairs(corners) do
                    if blZone:contains(corner) then
                        invalid = true
                        break
                    end
                end
                if invalid then break end
            end
        end

        -- 🎉 Se è valido → DONE
        if not invalid then
            return true
        end

        -- 🔁 Altrimenti shifta casualmente
        local shiftX = (math.random() - 0.5) * 1.0
        local shiftY = (math.random() - 0.5) * 1.0

        local pos = GetEntityCoords(object)
        SetEntityCoords(object, pos.x + shiftX, pos.y + shiftY, pos.z)

        PlaceObjectOnGroundProperly(object)
    end

    return false
end

function GetOBBCorners(entity)
    if not DoesEntityExist(entity) then return {} end

    local model = GetEntityModel(entity)
    local minDim, maxDim = GetModelDimensions(model)

    -- La matrice dà anche 'up' affidabile; 'forward' lo prendiamo dal native dedicato
    local m1, m2, m3, pos = GetEntityMatrix(entity) -- (ordine può variare tra right/forward; 'm3' è up)
    local up = norm(m3)
    local forward = norm(GetEntityForwardVector(entity))
    local right = norm(cross(forward, up)) -- ricava right coerente con forward+up

    -- fallback: se forward//up quasi paralleli (raro), usa m2 come right
    if (right.x * right.x + right.y * right.y + right.z * right.z) < 1e-6 then
        right = norm(m2)
    end

    -- 8 corner combinando min/max lungo gli assi locali (right/forward/up)
    local xs, ys, zs = { minDim.x, maxDim.x }, { minDim.y, maxDim.y }, { minDim.z, maxDim.z }
    local corners = {}
    for i = 1, 2 do
        for j = 1, 2 do
            for k = 1, 2 do
                local world = vector3(
                    pos.x + right.x * xs[i] + forward.x * ys[j] + up.x * zs[k],
                    pos.y + right.y * xs[i] + forward.y * ys[j] + up.y * zs[k],
                    pos.z + right.z * xs[i] + forward.z * ys[j] + up.z * zs[k]
                )
                corners[#corners + 1] = world
            end
        end
    end
    return corners
end