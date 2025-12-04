import { useCallback } from 'react';

/**
 * Custom hook for making NUI callbacks to the Lua server
 * @returns {Function} callback function that takes (eventName, ...args)
 */
const useNuiCallback = () => {
    const isDev = import.meta.env.DEV;

    const callback = useCallback(async (eventName, ...args) => {
        if (isDev) {
            // In development mode, return mock data
            console.log(`[DEV] NUI Callback: ${eventName}`, args);

            // Mock responses for development
            if (eventName === 'zBusinessManager:server:getEnabledModules') {
                return {
                    success: true,
                    modules: [
                        { id: 'crafting', label: 'CRAFTING.EXE', icon: '💾', color: '#22c55e', requiresPassword: true },
                        // Only crafting enabled in current config
                    ]
                };
            }

            if (eventName === 'zBusinessManager:server:verifyModulePassword') {
                // Mock password verification (accept '1234')
                return { success: args[1] === '1234' };
            }

            return { success: true };
        }

        // Production mode - actual NUI callback
        try {
            const response = await fetch(`https://${GetParentResourceName()}/nuiCallback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventName,
                    args
                })
            });

            return await response.json();
        } catch (error) {
            console.error(`NUI Callback failed for ${eventName}:`, error);
            return { success: false, error: error.message };
        }
    }, [isDev]);

    return callback;
};

// Helper to get resource name
function GetParentResourceName() {
    return 'zBusinessManager';
}

export default useNuiCallback;
