import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ComponentState } from './componentsSlice'
import { RootState } from '../store'

export interface Preset {
  id: string
  name: string
  component: ComponentState
  components: Record<string, ComponentState>
  createdAt: string
  updatedAt: string
}

interface PresetsState {
  presets: Record<string, Preset>
}

const initialState: PresetsState = {
  presets: {}
}

export const presetsSlice = createSlice({
  name: 'presets',
  initialState,
  reducers: {
    addPreset: (state, action: PayloadAction<{
      id: string
      name: string
      component: ComponentState
      components: Record<string, ComponentState>
    }>) => {
      const { id, name, component, components } = action.payload
      const now = new Date().toISOString()
      
      state.presets[id] = {
        id,
        name,
        component,
        components,
        createdAt: now,
        updatedAt: now
      }
    },

    updatePresetName: (state, action: PayloadAction<{
      id: string
      name: string
    }>) => {
      const { id, name } = action.payload
      if (state.presets[id]) {
        state.presets[id].name = name
        state.presets[id].updatedAt = new Date().toISOString()
      }
    },

    deletePreset: (state, action: PayloadAction<string>) => {
      delete state.presets[action.payload]
    }
  }
})

export const { addPreset, updatePresetName, deletePreset } = presetsSlice.actions

// Selector pour trouver les composants qui utilisent un preset
export const findComponentsUsingPreset = (state: RootState, presetId: string) => {
  const components = state.components.present.components
  return Object.values(components).filter(
    (component): component is ComponentState => 
      (component as ComponentState).componentName === state.presets.presets[presetId]?.name
  )
}

export default presetsSlice.reducer
