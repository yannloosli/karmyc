import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { ActionCreators } from 'redux-undo'
import type { RootState, AppDispatch } from './store'

// Hooks de base typés
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Hook pour undo/redo
export const useUndoRedo = (sliceName: 'app' | 'components' | 'customComponents') => {
  const dispatch = useAppDispatch()
  const state = useAppSelector((state) => state[sliceName])
  
  return {
    undo: () => dispatch(ActionCreators.undo() as any),
    redo: () => dispatch(ActionCreators.redo() as any),
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  }
}

// Hooks pour l'état de l'application
export const useAppState = () => {
  return useAppSelector((state) => state.app.present)
}

// Hooks pour les composants
export const useComponents = () => {
  const components = useAppSelector((state) => state.components.present.components)
  const selectedId = useAppSelector((state) => state.components.present.selectedId)
  const hoveredId = useAppSelector((state) => state.components.present.hoveredId)
  const rootComponents = useAppSelector((state) => state.components.present.rootComponents)
  const dispatch = useAppDispatch()

  return {
    components,
    selectedId,
    hoveredId,
    rootComponents,
    getComponent: (id: string) => components[id],
    getSelectedComponent: () => selectedId ? components[selectedId] : null,
    getHoveredComponent: () => hoveredId ? components[hoveredId] : null,
    getRootComponents: () => rootComponents.map(id => components[id])
  }
}

// Hooks pour les composants personnalisés
export const useCustomComponents = () => {
  const customComponents = useAppSelector((state) => state.customComponents.present.components)
  const selectedCustomId = useAppSelector((state) => state.customComponents.present.selectedCustomId)
  const dispatch = useAppDispatch()

  return {
    customComponents,
    selectedCustomId,
    getCustomComponent: (id: string) => customComponents[id],
    getSelectedCustomComponent: () => selectedCustomId ? customComponents[selectedCustomId] : null,
    getAllCustomComponents: () => Object.values(customComponents)
  }
}

// Hook pour vérifier si un composant a des modifications non sauvegardées
export const useHasChanges = (sliceName: 'app' | 'components' | 'customComponents') => {
  const state = useAppSelector((state) => state[sliceName])
  return state.past.length > 0
}

// Hook pour la gestion du thème
export const useTheme = () => {
  const theme = useAppSelector((state) => state.app.present.theme)
  const dispatch = useAppDispatch()
  
  return {
    theme,
    isDarkMode: theme === 'dark',
    toggleTheme: () => dispatch({ 
      type: 'app/setTheme', 
      payload: theme === 'dark' ? 'light' : 'dark' 
    })
  }
}

// Hook pour la gestion du chargement
export const useLoading = () => {
  const isLoading = useAppSelector((state) => state.app.present.isLoading)
  const dispatch = useAppDispatch()
  
  return {
    isLoading,
    setLoading: (loading: boolean) => dispatch({ 
      type: 'app/setLoading', 
      payload: loading 
    })
  }
}
