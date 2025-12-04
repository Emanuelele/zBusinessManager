fx_version   'cerulean'
use_fxv2_oal 'yes'
lua54        'yes'
game         'gta5'

name         'zBusinessManager'
author       'zeta'
version      '2.1.0'

shared_script 'shared.lua'

client_scripts {
    'core/client/*.lua',
    'modules/**/client/*.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'core/server/*.lua',
    'modules/**/server/*.lua'
}

shared_scripts {
    '@es_extended/imports.lua',
    '@ox_lib/init.lua',
    'config.lua',
    'core/shared/*.lua',
    'modules/*/config.lua',
    'modules/*/shared.lua',
    'modules/**/config/*.lua',
}

-- Files per la UI React (build) - usata solo come DUI sul prop
files {
    'ui/dist/index.html',
    'ui/dist/**/*',
    'html/bridge.html'
}

-- NUI bridge invisibile per catturare input tastiera
ui_page 'html/bridge.html'

dependencies {
    'ox_lib',
    'oxmysql',
    'ox_target'
}
