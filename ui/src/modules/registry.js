import Crafting from '../pages/Crafting';
import Cleaning from '../pages/Cleaning';
import NPCManagement from '../pages/NPCManagement';
import Income from '../pages/Income';
import Orders from '../pages/Orders';
import Payroll from '../pages/Payroll';
import SafeRegistry from '../pages/SafeRegistry';
import Sheriff from '../pages/Sheriff';
import Cardealer from '../pages/Cardealer';

// Module Registry
// Maps module IDs to their components and metadata
export const modules = {
    crafting: {
        id: 'crafting',
        path: '/crafting',
        label: 'PRODUZIONE',
        icon: '🔨', // Will be replaced by Floppy Disk UI
        component: Crafting,
        requiresJob: false,
        requiresPassword: false,
        color: 'green'
    },
    cleaning: {
        id: 'cleaning',
        path: '/cleaning',
        label: 'PULIZIA',
        icon: '🧹',
        component: Cleaning,
        requiresJob: false,
        requiresPassword: false,
        color: 'cyan'
    },
    npc: {
        id: 'npc',
        path: '/npc',
        label: 'PERSONALE',
        icon: '👥',
        component: NPCManagement,
        requiresJob: true, // Only owner/manager
        requiresPassword: true, // Protected
        color: 'yellow'
    },
    income: {
        id: 'income',
        path: '/income',
        label: 'FINANZE',
        icon: '💰',
        component: Income,
        requiresJob: true,
        requiresPassword: true,
        color: 'green'
    },
    orders: {
        id: 'orders',
        path: '/orders',
        label: 'ORDINI',
        icon: '📦',
        component: Orders,
        requiresJob: false,
        requiresPassword: false,
        color: 'orange'
    },
    payroll: {
        id: 'payroll',
        path: '/payroll',
        label: 'CEDOLINI',
        icon: '📄',
        component: Payroll,
        requiresJob: true,
        requiresPassword: true,
        color: 'blue'
    },
    safe_registry: {
        id: 'safe_registry',
        path: '/safe_registry',
        label: 'CASSETTE',
        icon: '🔐',
        component: SafeRegistry,
        requiresJob: true,
        requiresPassword: true,
        color: 'red'
    },
    sheriff: {
        id: 'sheriff',
        path: '/sheriff',
        label: 'SHERIFF',
        icon: '👮',
        component: Sheriff,
        requiresJob: true,
        requiresPassword: true,
        color: 'red'
    },
    cardealer: {
        id: 'cardealer',
        path: '/cardealer',
        label: 'CARDEALER',
        icon: '🚗',
        component: Cardealer,
        requiresJob: true,
        requiresPassword: true,
        color: 'red'
    }
};

export const getModule = (id) => modules[id];
export const getAllModules = () => Object.values(modules);
