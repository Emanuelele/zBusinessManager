import { createContext, useContext, useState } from 'react';

const ModuleContext = createContext();

export function ModuleProvider({ children }) {
  const [unlockedModules, setUnlockedModules] = useState(new Set());
  const [loadedModules, setLoadedModules] = useState(new Set());

  const unlockModule = (moduleId) => {
    setUnlockedModules(prev => new Set([...prev, moduleId]));
  };

  const loadModule = (moduleId) => {
    setLoadedModules(prev => new Set([...prev, moduleId]));
  };

  const isModuleUnlocked = (moduleId) => {
    return unlockedModules.has(moduleId);
  };

  return (
    <ModuleContext.Provider value={{ unlockedModules, unlockModule, isModuleUnlocked, loadedModules, loadModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within ModuleProvider');
  }
  return context;
}
