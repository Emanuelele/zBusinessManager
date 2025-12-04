Config = Config or {}

Config.Debug = false

-- ============================================
-- MODULE REGISTRY (Floppy Disk System)
-- ============================================
-- Define all available modules and their global settings
Config.Modules = {
    crafting = {
        id = 'crafting',
        label = 'PRODUCTION.EXE',
        enabled = true,
        icon = '💾',
        color = '#22c55e' -- green
    },
    cleaning = {
        id = 'cleaning',
        label = 'DIRTMANAGER.EXE',
        enabled = true,
        icon = '💾',
        color = '#06b6d4' -- cyan
    },
    npc = {
        id = 'npc',
        label = 'PERSONALE.EXE',
        enabled = true,
        icon = '💾',
        color = '#eab308' -- yellow
    },
    income = {
        id = 'income',
        label = 'INCOME.EXE',
        enabled = true,
        icon = '💾',
        color = '#22c55e' -- green
    },
    orders = {
        id = 'orders',
        label = 'ORDINI.EXE',
        enabled = true,
        icon = '💾',
        color = '#f97316' -- orange
    },
    payroll = {
        id = 'payroll',
        label = 'CEDOLINI.EXE',
        enabled = true,
        icon = '💾',
        color = '#3b82f6' -- blue
    },
    safe_registry = {
        id = 'safe_registry',
        label = 'CASSETTE.EXE',
        enabled = true,
        icon = '💾',
        color = '#ef4444' -- red
    },
    sheriff = {
        id = 'sheriff',
        label = 'SHERIFF.EXE',
        enabled = true,
        icon = '💾',
        color = '#ef4444' -- red
    },
    cardealer = {
        id = 'cardealer',
        label = 'CARDEALER.EXE',
        enabled = true,
        icon = '💾',
        color = '#ef4444' -- red
    },
}

Config.Dirt = {
    minPerPlayer = 0,
    maxPerPlayer = 4,
    multiplier   = 1,
    minPlayers   = 1,
    minDistanceFromBlacklist = 1.0,
    minDistanceFromMainZone = 0.3,
    maxAmount = 30,
    npcModel = "a_m_m_business_01",
    props = {
        "ng_proc_paper_03a",
        "ng_proc_coffee_03b",
        "ng_proc_litter_plasbot2",
        "ng_proc_food_chips01c",
        "ng_proc_cigpak01c",
    }
}

Config.CleaningUpgrades = {
    capacity = {
        label = "Capacità Bidoni",
        description = "Aumenta la quantità massima di sporco tollerabile.",
        levels = {
            [1] = { cost = 0, value = 30 },     -- Base
            [2] = { cost = 5000, value = 50 },
            [3] = { cost = 12000, value = 80 },
            [4] = { cost = 25000, value = 120 },
            [5] = { cost = 50000, value = 200 }
        }
    },
    efficiency = {
        label = "Kit Pulizia Avanzato",
        description = "Riduce il tempo necessario per pulire ogni macchia.",
        levels = {
            [1] = { cost = 0, value = 1.0, count = 2 },    -- Base: 100% time, 1 prop
            [2] = { cost = 8000, value = 0.8, count = 3 }, -- 80% time, 2 props
            [3] = { cost = 15000, value = 0.6, count = 5 }, -- 60% time, 3 props
            [4] = { cost = 30000, value = 0.4, count = 8 }, -- 40% time, 4 props
            [5] = { cost = 60000, value = 0.2, count = 12 }  -- 20% time, 5 props
        }
    },
    filters = {
        label = "Filtri Aria HEPA",
        description = "Rallenta l'accumulo naturale di sporco nel locale.",
        levels = {
            [1] = { cost = 0, value = 1.0 },    -- Base multiplier (100% accumulation)
            [2] = { cost = 10000, value = 0.9 }, -- 90% accumulation
            [3] = { cost = 20000, value = 0.75 },
            [4] = { cost = 40000, value = 0.6 },
            [5] = { cost = 80000, value = 0.4 }
        }
    }
}

Config.NPC = {
    Levels = {
        [1] = {
            cost = 0,
            wage = 500,
            craftSpeed = 1.0,
            queueSize = 3
        },
        [2] = {
            cost = 10000,
            wage = 450,
            craftSpeed = 0.9,
            queueSize = 5
        },
        [3] = {
            cost = 25000,
            wage = 400,
            craftSpeed = 0.8,
            queueSize = 8
        },
        [4] = {
            cost = 50000,
            wage = 350,
            craftSpeed = 0.7,
            queueSize = 10
        },
        [5] = {
            cost = 100000,
            wage = 300,
            craftSpeed = 0.5,
            queueSize = 15
        }
    }
}

Config.IncomeUpgrades = {
    minPlayers = {
        label = "Requisiti Clienti",
        description = "Riduce il numero minimo di persone necessarie per generare introiti.",
        levels = {
            [1] = { cost = 0, value = 3 },      -- Need 3 players minimum
            [2] = { cost = 10000, value = 2 },
            [3] = { cost = 25000, value = 1 },  -- Only 1 player needed
        }
    },
    maxCap = {
        label = "Capacità Locale",
        description = "Aumenta il numero massimo di clienti che contribuiscono agli introiti.",
        levels = {
            [1] = { cost = 0, value = 5 },      -- Max 5 players counted
            [2] = { cost = 15000, value = 8 },
            [3] = { cost = 30000, value = 12 },
            [4] = { cost = 60000, value = 20 },
        }
    },
    rate = {
        label = "Efficienza Servizio",
        description = "Aumenta il guadagno per cliente al minuto.",
        levels = {
            [1] = { cost = 0, value = 10 },     -- $10/player/minute
            [2] = { cost = 20000, value = 20 },
            [3] = { cost = 40000, value = 35 },
            [4] = { cost = 80000, value = 50 },
            [5] = { cost = 150000, value = 75 },
        }
    }
}

Config.BusinessDefinitions = {
    pipedown = {
        label = "Pipe Down",
        -- Modular System: Define which modules are available with optional passwords
        -- Format: { moduleId = { password = "1234" } } or { moduleId = {} } for no password
        modules = {
            crafting = { password = "1234" },  -- Protected with password
            cleaning = {},                     -- No password
            income = {},                       -- No password
        },
        zone = {
            points = {
                vec3(-271.23999023438, 6225.7998046875, 31.0),
                vec3(-269.98001098633, 6227.259765625, 31.0),
                vec3(-266.64001464844, 6230.5698242188, 31.0),
                vec3(-267.54000854492, 6230.6401367188, 31.0),
                vec3(-268.07000732422, 6230.8198242188, 31.0),
                vec3(-268.60998535156, 6231.3598632812, 31.0),
                vec3(-269.66000366211, 6232.3500976562, 31.0),
                vec3(-270.33999633789, 6233.1098632812, 31.0),
                vec3(-271.13000488281, 6234.1801757812, 31.0),
                vec3(-270.5, 6234.8701171875, 31.0),
                vec3(-268.10000610352, 6237.1899414062, 31.0),
                vec3(-269.04000854492, 6237.5600585938, 31.0),
                vec3(-270.0299987793, 6238.9399414062, 31.0),
                vec3(-272.10000610352, 6240.6098632812, 31.0),
                vec3(-272.92001342773, 6239.9399414062, 31.0),
                vec3(-274.45001220703, 6238.5200195312, 31.0),
                vec3(-275.25, 6239.3701171875, 31.0),
                vec3(-277.25, 6237.5698242188, 31.0),
                vec3(-276.32000732422, 6236.66015625, 31.0),
                vec3(-278.5, 6234.3798828125, 31.0),
                vec3(-276.25, 6231.7797851562, 31.0),
                vec3(-275.70001220703, 6231.169921875, 31.0),
                vec3(-275.55999755859, 6231.2998046875, 31.0),
                vec3(-274.44000244141, 6230.1401367188, 31.0),
                vec3(-273.91000366211, 6229.259765625, 31.0),
                vec3(-273.20001220703, 6228.33984375, 31.0),
                vec3(-272.57998657227, 6228.33984375, 31.0),
                vec3(-272.2799987793, 6228.0400390625, 31.0),
                vec3(-272.2200012207, 6227.5297851562, 31.0),
                vec3(-271.5, 6226.8701171875, 31.0),
                vec3(-271.76000976562, 6226.4501953125, 31.0),
            },
            thickness = 3,
        },
        npcCoords = vec3(-267.9136, 6237.0796, 31.4901),
        blacklist_zones = {
            {
                coords = vec3(-271.87, 6230.71, 31.0),
                size = vec3(4.05, 2.0, 5.0),
                rotation = 315.0,
            },
            {
                coords = vec3(-276.18, 6234.7, 31.0),
                size = vec3(1.15, 2.0, 4.0),
                rotation = 315.0,
            },
            {
                coords = vec3(-274.82, 6233.31, 31.0),
                size = vec3(1, 1.9, 4.0),
                rotation = 315.0,
            },
            {
                coords = vec3(-271.01, 6237.03, 31.0),
                size = vec3(2.0, 1.0, 4.0),
                rotation = 225.0,
            },
            {
                name = "bl_pipe_5",
                coords = vec3(-272.4, 6238.3, 31.0),
                size = vec3(0.85000000000001, 2.05, 4.0),
                rotation = 314.5,
            }
        },
        terminal = {
            coords = vec3(-266.965, 6228.639, 36.211),
            radius = 5.0,
            texturedict = "markz_props_terminal_ytd",
            texture = "markz_terminalscreen_d",
            prop_model = "markz_prop_sheriff_terminal"
        },
        credentials = {
            username = "pipe",
            password = "pipe",
        },
        craftnpc = {
            coords = vec3(-266.3731, 6232.1826, 31.4901),
            heading = 131.0949,
            model = "a_m_m_business_01",
            animIdle = {
                dict = "anim@mp_corona_idles@male_d@idle_a",
                name = "idle_a"
            },
            items = {
                screwdriver = {
                    label = "Cacciavite",
                    required = {
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                        { item = "pen", quantity = 1 },
                    }
                },
                camera = {
                    label = "Macchina Fotografica",
                    required = {
                        { item = "screwdriver", quantity = 5 },
                    }
                },
                battery = {
                    label = "Batteria",
                    required = {
                        { item = "camera", quantity = 1 },
                    }
                },
                ticket_drink = {
                    label = "Biglietto Drink",
                    required = {
                        { item = "pen", quantity = 1 },
                    }
                },
                guitarblues = {
                    label = "Chitarra Blues",
                    required = {
                        { item = "pen", quantity = 1 },
                    }
                },
                riot_shield = {
                    label = "Scudo Anti-Riot",
                    required = {
                        { item = "pen", quantity = 5 },
                    }
                },
                megaphone = {
                    label = "Megafono",
                    required = {
                        { item = "screwdriver", quantity = 5 },
                    }
                },
                ring2 = {
                    label = "Anello 2",
                    required = {
                        { item = "pen", quantity = 5 },
                    }
                },
                clock = {
                    label = "Orologio",
                    required = {
                        { item = "pen", quantity = 2 },
                    }
                },
                racoon = {
                    label = "Raccoon",
                    required = {
                        { item = "pen", quantity = 2 },
                    }
                },
                coffee2 = {
                    label = "Caffè",
                    required = {
                        { item = "pen", quantity = 2 },
                    }
                },
                water = {
                    label = "Acqua",
                    required = {
                        { item = "pen", quantity = 2 },
                    }
                },
                chips = {
                    label = "Patatine",
                    required = {
                        { item = "pen", quantity = 2 },
                    }
                },
                boxed_food = {
                    label = "Cibo in scatola",
                    required = {
                        { item = "pen", quantity = 2 },
                    }
                },
            },
            stock_stash = {
                id = "pipedown_stock",
                label = "Magazzino Pipe Down",
                slots = 50,
                maxWeight = 100000,
            },
            craft_time = 60000,
            anim_on_craft = {
                dict = "anim@amb@clubhouse@tutorial@bkr_tut_ig3@",
                anim = "machinic_loop_mechandplayer",
            }
        }
    },
    bank = {
        label = "BANCA",
        modules = {
            payroll = {password = "555"},
            safe_registry = {password = "765"},
        },
        terminal = {
            coords = vec3(-90.443, 6465.584, 31.572),
            radius = 5.0,
            texturedict = "markz_props_terminal_ytd",
            texture = "markz_terminalscreen_d",
            prop_model = "markz_prop_sheriff_terminal"
        },
        credentials = {
            username = "bank",
            password = "bank",
        }
    },
    sheriff = {
        label = "SHERIFF",
        modules = {
            sheriff = {password = "555"},
            payroll = {password = "555"},
        },
        terminal = {
            coords = vec3(-433.2826, 6005.4976, 36.8717),
            radius = 5.0,
            texturedict = "markz_props_terminal_ytd",
            texture = "markz_terminalscreen_d",
            prop_model = "markz_prop_sheriff_terminal"
        },
        credentials = {
            username = "sheriff",
            password = "sheriff",
        }
    },
    cardealer = {
        label = "CARDEALER",
        modules = {
            cardealer = { password = "eudora" },
        },
        terminal = {
            coords = vec3(-235.8895, 6211.1743, 32.0),
            radius = 5.0,
            texturedict = "markz_props_terminal_ytd",
            texture = "markz_terminalscreen_d",
            prop_model = "markz_prop_sheriff_terminal"
        },
        credentials = {
            username = "dealer",
            password = "dealer",
        }
    },
}

Config.AllowedVehicles = {
    `polgreenwood`,
    `polgreenwoodfib`,
    `policevbold3`,
    `policeb`,
    `polimpaler6d`,
}
