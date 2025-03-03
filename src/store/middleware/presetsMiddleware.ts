import { Middleware } from '@reduxjs/toolkit'
import { deletePreset, findComponentsUsingPreset } from '../slices/presetsSlice'
import { updateComponent } from '../slices/componentsSlice'

export const presetsMiddleware: Middleware = store => next => action => {
  // Si l'action est deletePreset
  if (deletePreset.match(action)) {
    const presetId = action.payload
    const state = store.getState()
    
    // Trouver tous les composants qui utilisent ce preset
    const componentsUsingPreset = findComponentsUsingPreset(state, presetId)
    
    // Supprimer le componentName de ces composants
    componentsUsingPreset.forEach(component => {
      store.dispatch(updateComponent({
        id: component.id,
        updates: {
          componentName: undefined
        }
      }))
    })
  }
  
  return next(action)
} 
