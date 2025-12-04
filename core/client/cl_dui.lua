-- DUI Management Module

DUIManager = {}
DUIManager.businesses = {}

function DUIManager.Create(businessId, businessData)
    if not businessData.terminal then return end

    -- Request prop model
    local propHash = GetHashKey(businessData.terminal.prop_model)
    RequestModel(propHash)
    while not HasModelLoaded(propHash) do
        Wait(0)
    end

    -- Request texture dictionary
    if businessData.terminal.texturedict then
        RequestStreamedTextureDict(businessData.terminal.texturedict, false)
        while not HasStreamedTextureDictLoaded(businessData.terminal.texturedict) do
            Wait(0)
        end
    end

    if not lib or not lib.dui then
        --print("^1[DUI] ERROR: ox_lib DUI module not found")
        return
    end

    -- Rimuovi DUI esistente se presente
    if DUIManager.businesses[businessId] then
        if DUIManager.businesses[businessId].dui then
            pcall(function()
                DUIManager.businesses[businessId].dui:remove()
            end)
        end
        DUIManager.businesses[businessId] = nil
    end

    -- Crea DUI con cache bust aggressivo per forzare reload
    local cacheBust = math.random(1000000, 9999999)
    local timestamp = GetGameTimer()
    local gameTimer = GetGameTimer()
    local dui = lib.dui:new({
        url = 'nui://zBusinessManager/ui/dist/index.html',
        width = math.ceil(1920*1.1),
        height = math.ceil(1080*1.1)
    })

    if not dui then
        --print("^1[DUI] ERROR: Failed to create DUI for " .. businessId)
        return
    end

    -- Trova il prop nella mappa
    local coords = businessData.terminal.coords
    local prop = 0
    local attempts = 0
    
    -- Retry loop per trovare il prop (utile al login quando il mondo sta caricando)
    while attempts < 50 do
        prop = GetClosestObjectOfType(coords.x, coords.y, coords.z, 5.0, propHash, false, false, false)
        if DoesEntityExist(prop) then
            break
        end
        attempts = attempts + 1
        Wait(100)
    end

    if not DoesEntityExist(prop) then
        --print("^3[DUI] WARNING: Prop not found for " .. businessId)
        if dui then dui:remove() end
        return
    end

    -- Applica texture replacement
    local duiDict = dui.dictName
    local duiTxt = dui.txtName


    -- Salva riferimenti
    DUIManager.businesses[businessId] = {
        dui = dui,
        prop = prop,
        coords = coords,
        texturedict = businessData.terminal.texturedict,
        texture = businessData.terminal.texture,
        duiDict = duiDict,
        duiTxt = duiTxt
    }

    Wait(1000)
    AddReplaceTexture(businessData.terminal.texturedict, businessData.terminal.texture, duiDict, duiTxt)
    print("^2[DUI] Successfully created for " .. businessId)

    -- Thread per mantenere texture replacement
    -- CreateThread(function()
    --     while DUIManager.businesses[businessId] do
    --         Wait(1000) -- Check every second
    --         local playerCoords = GetEntityCoords(PlayerPedId())
    --         local distance = #(playerCoords - coords)

    --         if distance < 20.0 then
    --             -- Re-apply texture just in case it was lost due to streaming
    --             AddReplaceTexture(businessData.terminal.texturedict, businessData.terminal.texture, duiDict, duiTxt)
    --         end
    --     end
    -- end)
end

function DUIManager.SendMessage(businessId, message)
    local business = DUIManager.businesses[businessId]
    if business and business.dui then
        business.dui:sendMessage(message)
    end
end

function DUIManager.Remove(businessId)
    local business = DUIManager.businesses[businessId]
    if business and business.dui then
        business.dui:remove()
        DUIManager.businesses[businessId] = nil
        --print("^2[DUI] Removed for " .. businessId)
    end
end

function DUIManager.RemoveAll()
    for businessId, _ in pairs(DUIManager.businesses) do
        DUIManager.Remove(businessId)
    end
end

return DUIManager
