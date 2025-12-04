Config = Config or {}
print("[DEBUG] Loading Bank Config...")

Config.Bank = {
    RenewalInterval = 30 * 24 * 60 * 60, -- 30 days in seconds
    business_vaults = {
        pipe = {
            stash_id = "safe_bank_1"
        },
        sheriff = {
            stash_id = "safe_bank_2",
            coords  = vector3(-93.56371307373, 6473.794921875, 26.853147506714),
            label = "Cassaforte 2",
        }
    },
    -- List of assignable safes for the registry
    SafeList = {
        { id = "safe_bank_1", label = "Cassetta #001" },
        { id = "safe_bank_2", label = "Cassetta #002" },
        { id = "safe_bank_3", label = "Cassetta #003" },
        { id = "safe_bank_4", label = "Cassetta #004" },
        { id = "safe_bank_5", label = "Cassetta #005" },
        { id = "safe_bank_6", label = "Cassetta #006" },
        { id = "safe_bank_7", label = "Cassetta #007" },
        { id = "safe_bank_8", label = "Cassetta #008" },
        { id = "safe_bank_9", label = "Cassetta #009" },
        { id = "safe_bank_10", label = "Cassetta #010" },
    }
}