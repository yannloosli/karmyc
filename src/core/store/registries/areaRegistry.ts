
interface IAreaRegistry {
  registerComponent: (areaType: string, component: any) => void;
  registerReducer: (areaType: string, reducer: any) => void;
  registerKeyboardShortcuts: (areaType: string, shortcuts: any) => void;
  registerReactKey: (areaType: string, key: string) => void;
  registerDisplayName: (areaType: string, name: string) => void;
  registerIcon: (areaType: string, icon: any) => void;
  unregisterAreaType: (areaType: string) => void;
}

// Stockage en mémoire des zones enregistrées
const areaStorage = new Map<string, {
  component?: any;
  reducer?: any;
  keyboardShortcuts?: any;
  reactKey?: string;
  displayName?: string;
  icon?: any;
}>();

export const areaRegistry: IAreaRegistry = {
  registerComponent: (areaType: string, component: any) => {
    const existing = areaStorage.get(areaType) || {};
    areaStorage.set(areaType, { ...existing, component });
  },

  registerReducer: (areaType: string, reducer: any) => {
    const existing = areaStorage.get(areaType) || {};
    areaStorage.set(areaType, { ...existing, reducer });
  },

  registerKeyboardShortcuts: (areaType: string, shortcuts: any) => {
    const existing = areaStorage.get(areaType) || {};
    areaStorage.set(areaType, { ...existing, keyboardShortcuts: shortcuts });
  },

  registerReactKey: (areaType: string, key: string) => {
    const existing = areaStorage.get(areaType) || {};
    areaStorage.set(areaType, { ...existing, reactKey: key });
  },

  registerDisplayName: (areaType: string, name: string) => {
    const existing = areaStorage.get(areaType) || {};
    areaStorage.set(areaType, { ...existing, displayName: name });
  },

  registerIcon: (areaType: string, icon: any) => {
    const existing = areaStorage.get(areaType) || {};
    areaStorage.set(areaType, { ...existing, icon });
  },

  unregisterAreaType: (areaType: string) => {
    areaStorage.delete(areaType);
  }
}; 
