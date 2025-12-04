-- local function CreateDirtNPC(businessKey, dirtId, coords)
--     local npc = CreatePed(4, Config.Dirt.npcModel, coords.x, coords.y, coords.z, 0.0, false, true)

--     -- Aggiungi il dirt all'NPC

--     return npc
-- end

-- Citizen.CreateThread(function()
--     for businessKey, businessDef in pairs(Config.BusinessDefinitions) do
--         if businessDef.zone and businessDef.zone.dirt then
--             local dirtNPC = CreateDirtNPC(businessKey, "npc_" .. businessKey, businessDef.npcCoords)
--             businessDef.dirtNPC = dirtNPC
--         end
--     end
-- end)

