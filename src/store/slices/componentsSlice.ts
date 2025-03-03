import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_PROPS } from 'src/utils/defaultProps'
import templates, { TemplateType } from 'src/templates'
import { generateId } from 'src/utils/generateId'
import { duplicateComponent } from 'src/utils/recursive'
import { deleteComponent as deleteComponentUtil } from 'src/utils/recursive'
import omit from 'lodash/omit'
import { ComponentWithRefs } from 'src/custom-components/refComponents'
import { v4 as uuid } from 'uuid'
import { onboarding } from '../../templates/onboarding'

const DEFAULT_ID = 'root'
const componentsWithRefs = Object.keys(ComponentWithRefs)

// Types pour les composants
export interface ComponentState {
  id: string
  type: string
  props: Record<string, any>
  children: string[]
  parent: string | null
  rootParentType?: string
  componentName?: string
  params?: Array<{
    name: string
    type: string
    value: string
    optional: boolean
    exposed: boolean
    ref: boolean
  }>
}

interface ComponentsState {
  components: Record<string, ComponentState>
  selectedId: string | null
  hoveredId: string | null
  rootComponents: string[]
  sortHoveredId?: string
  sortPosition?: 'top' | 'bottom'
}

const initialState: ComponentsState = {
  components: {
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: ['default-container'],
      parent: null,
      componentName: 'Root'
    },
    'default-container': {
      id: 'default-container',
      type: 'Container',
      props: {
        maxW: 'container.xl',
        p: 4,
        centerContent: true
      },
      children: [],
      parent: 'root',
      componentName: 'Container'
    }
  },
  selectedId: 'default-container',
  hoveredId: null,
  rootComponents: [],
  sortHoveredId: undefined,
  sortPosition: undefined
}

const componentsSlice = createSlice({
  name: 'components',
  initialState,
  reducers: {
    addComponentBase: (state, action: PayloadAction<{
      id: string,
      component: ComponentState
    }>) => {
      const { id, component } = action.payload
      state.components[id] = component
      
      if (!component.parent) {
        state.rootComponents.push(id)
      } else if (state.components[component.parent]) {
        state.components[component.parent].children.push(id)
      }
    },
    
    updateComponent: (state, action: PayloadAction<{
      id: string,
      updates: Partial<ComponentState>
    }>) => {
      const { id, updates } = action.payload
      if (state.components[id]) {
        state.components[id] = { ...state.components[id], ...updates }
      }
    },
    
    deleteComponent: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const component = state.components[id]
      
      if (component) {
        // Supprimer des enfants du parent
        if (component.parent && state.components[component.parent]) {
          state.components[component.parent].children = 
            state.components[component.parent].children.filter(childId => childId !== id)
        }
        
        // Supprimer des rootComponents si nécessaire
        state.rootComponents = state.rootComponents.filter(rootId => rootId !== id)
        
        // Supprimer le composant
        delete state.components[id]
      }
    },
    
    setSelectedComponent: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload
    },
    
    setHoveredComponent: (state, action: PayloadAction<string | null>) => {
      state.hoveredId = action.payload
    },

    moveComponent: (state, action: PayloadAction<{ 
      parentId: string
      componentId: string
      index?: number 
    }>) => {
      const { parentId, componentId, index } = action.payload
      
      // Vérifier que le composant à déplacer existe
      if (!state.components[componentId]) {
        console.warn(`Component with id ${componentId} not found`)
        return
      }

      // Vérifier que le nouveau parent existe
      if (!state.components[parentId]) {
        console.warn(`Parent component with id ${parentId} not found`)
        return
      }

      // Vérifier que le parent actuel existe
      const previousParentId = state.components[componentId].parent
      if (!previousParentId || !state.components[previousParentId]) {
        console.warn(`Previous parent component not found for component ${componentId}`)
        return
      }

      // Ne rien faire si le composant est déjà dans le bon parent
      if (previousParentId === parentId || parentId === componentId) return

      // Retirer de l'ancien parent
      state.components[previousParentId].children = 
        state.components[previousParentId].children.filter(id => id !== componentId)

      // Mettre à jour le parent du composant
      state.components[componentId].parent = parentId

      // Ajouter au nouveau parent
      if (typeof index === 'number') {
        state.components[parentId].children.splice(index, 0, componentId)
      } else {
        state.components[parentId].children.push(componentId)
      }
    },

    moveSelectedComponentChildren: (state, action: PayloadAction<{
      droppedId: string
      targetId: string
      position: 'top' | 'bottom'
    }>) => {
      const { droppedId, targetId, position } = action.payload
      
      // Vérifier que les composants existent
      if (!state.components[targetId]) {
        console.warn(`Component with id ${targetId} not found`)
        return
      }
      
      const targetParentId = state.components[targetId].parent
      if (!state.components[targetParentId]) {
        console.warn(`Parent component with id ${targetParentId} not found`)
        return
      }
      
      const droppedParentId = state.components[droppedId]?.parent
      if (!droppedParentId || !state.components[droppedParentId]) {
        console.warn(`Parent component for dropped item ${droppedId} not found`)
        return
      }

      // Retirer de l'ancien parent
      state.components[droppedParentId].children = 
        state.components[droppedParentId].children.filter(id => id !== droppedId)

      // Ajouter au nouveau parent
      const targetIndex = state.components[targetParentId].children.indexOf(targetId)
      state.components[targetParentId].children.splice(
        targetIndex + (position === 'bottom' ? 1 : 0),
        0,
        droppedId
      )

      if (targetParentId !== droppedParentId) {
        state.components[droppedId].parent = targetParentId
      }
    },

    addComponentPayload: (state, action: PayloadAction<{
      parentName: string
      type: string
      rootParentType?: string
      testId?: string
      index?: number
    }>) => {
      const { parentName, type, rootParentType, testId, index } = action.payload
      const id = testId || generateId(type)
      const { form, ...defaultProps } = DEFAULT_PROPS[type] || {}

      state.selectedId = id
      
      // Vérifier que le composant parent existe
      if (!state.components[parentName]) {
        state.components[parentName] = {
          id: parentName,
          type: 'Box',
          props: {},
          children: [],
          parent: null,
          componentName: 'Box'
        }
      }

      // Créer le composant principal
      state.components[id] = {
        id,
        type,
        props: defaultProps,
        children: [],
        parent: parentName,
        rootParentType,
        componentName: type
      }

      // Gérer les sous-composants pour Progress
      if (type === 'Progress') {
        const trackId = `${id}-track`
        const filledId = `${id}-filled`
        
        // Créer ProgressTrack
        state.components[trackId] = {
          id: trackId,
          type: 'ProgressTrack',
          props: DEFAULT_PROPS['ProgressTrack'] || {},
          children: [filledId],
          parent: id,
          componentName: 'ProgressTrack'
        }

        // Créer ProgressFilledTrack
        state.components[filledId] = {
          id: filledId,
          type: 'ProgressFilledTrack',
          props: DEFAULT_PROPS['ProgressFilledTrack'] || {},
          children: [],
          parent: trackId,
          componentName: 'ProgressFilledTrack'
        }

        // Ajouter ProgressTrack aux enfants du Progress
        state.components[id].children.push(trackId)
      }

      // Ajouter le composant aux enfants du parent
      if (typeof index === 'number') {
        state.components[parentName].children.splice(index, 0, id)
      } else {
        state.components[parentName].children.push(id)
      }
    },

    select: (state, action: PayloadAction<IComponent['id']>) => {
      state.selectedId = action.payload
    },

    unselect: (state) => {
      state.selectedId = DEFAULT_ID
    },

    selectParent: (state) => {
      const selectedComponent = state.components[state.selectedId]
      state.selectedId = state.components[selectedComponent.parent].id
    },

    duplicate: (state) => {
      const selectedComponent = state.components[state.selectedId]
      if (selectedComponent.id === DEFAULT_ID) return

      const parentElement = state.components[selectedComponent.parent]
      const { newId, clonedComponents } = duplicateComponent(
        selectedComponent,
        state.components,
      )

      state.components = { ...state.components, ...clonedComponents }
      state.components[parentElement.id].children.push(newId)
    },

    setComponentName: (state, action: PayloadAction<{
      componentId: string
      name: string
    }>) => {
      state.components[action.payload.componentId].componentName = action.payload.name
    },

    hover: (state, action: PayloadAction<IComponent['id']>) => {
      state.hoveredId = action.payload
    },

    unhover: (state) => {
      state.hoveredId = undefined
    },

    sortHover: (state, action: PayloadAction<{
      componentId: IComponent['id']
      position: 'top' | 'bottom'
    }>) => {
      state.sortHoveredId = action.payload.componentId
      state.sortPosition = action.payload.position
    },

    sortUnhover: (state) => {
      state.sortHoveredId = undefined
      state.sortPosition = undefined
    },

    reset: (state) => {
      state.components = {}
      state.selectedId = null
      state.hoveredId = null
      state.rootComponents = []
      state.sortHoveredId = undefined
      state.sortPosition = undefined
    },

    loadDemo: (state, action: PayloadAction<string>) => {
      if (action.payload === 'onboarding') {
        // Copier directement l'état de onboarding
        state.components = { ...onboarding }
        // Sélectionner le composant root
        state.selectedId = 'root'
        state.hoveredId = null
        state.sortHoveredId = null
        state.sortPosition = null
      }
    },

    deleteProps: (state, action: PayloadAction<{ id: string, name: string }>) => {
      const { id, name } = action.payload
      if (state.components[id]) {
        delete state.components[id].props[name]
      }
    },

    updateProps: (state, action: PayloadAction<{
      componentId: string
      props: Record<string, any>
    }>) => {
      const { componentId, props } = action.payload
      if (state.components[componentId]) {
        state.components[componentId].props = {
          ...state.components[componentId].props,
          ...props
        }
      }
    },

    deleteParams: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const { id, name } = action.payload
      if (state.components[id]?.params) {
        state.components[id].params = state.components[id].params.filter(
          param => param.name !== name
        )
      }
    },

    resetProps: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const type = state.components[id].type
      const { form, ...defaultProps } = DEFAULT_PROPS[type] || {}
      state.components[id].props = defaultProps || {}
    },

    addComponent: (
      state,
      action: PayloadAction<{
        parentId: string
        componentId?: string
        type: string
        rootParentType?: string
      }>,
    ) => {
      const { parentId, type, rootParentType } = action.payload
      const componentId = action.payload.componentId || `${type}-${uuid()}`
      const { form, ...defaultProps } = DEFAULT_PROPS[type] || {}

      // Créer le composant principal
      const createComponent = (id: string, componentType: string, parent: string) => {
        const { form: _, ...props } = DEFAULT_PROPS[componentType] || {}
        return {
          id,
          type: componentType,
          props: props || {},
          children: [],
          parent,
          rootParentType: rootParentType || componentType,
          componentName: componentType
        }
      }

      // Créer et ajouter le composant principal
      state.components[componentId] = createComponent(componentId, type, parentId)
      state.components[parentId].children.push(componentId)
      state.selectedId = componentId

      // Gérer les sous-composants du Progress
      if (type === 'Progress') {
        const trackId = `${componentId}-track`
        const filledTrackId = `${componentId}-filled`

        // Créer ProgressTrack
        state.components[trackId] = createComponent(trackId, 'ProgressTrack', componentId)
        state.components[componentId].children.push(trackId)

        // Créer ProgressFilledTrack
        state.components[filledTrackId] = createComponent(filledTrackId, 'ProgressFilledTrack', componentId)
        state.components[componentId].children.push(filledTrackId)

        // Ajouter les refs pour les sous-composants
        const addRef = (id: string, componentType: string) => {
          const ref = `ref${id.replace('-', '_')}`
          if (!state.components['root'].params) {
            state.components['root'].params = []
          }
          state.components['root'].params.push({
            name: ref,
            type: `RefObject<${ComponentWithRefs[componentType] || 'HTMLDivElement'}>`,
            value: 'null',
            optional: true,
            exposed: false,
            ref: true,
          })
          state.components[id].props['ref'] = `{${ref}}`
        }

        addRef(trackId, 'ProgressTrack')
        addRef(filledTrackId, 'ProgressFilledTrack')
      }

      // Gérer les refs pour les autres composants si nécessaire
      if (componentsWithRefs.includes(type)) {
        const ref = `ref${componentId.replace('-', '_')}`
        if (!state.components['root'].params) {
          state.components['root'].params = []
        }
        state.components['root'].params.push({
          name: ref,
          type: `RefObject<${ComponentWithRefs[type] || 'HTMLDivElement'}>`,
          value: 'null',
          optional: true,
          exposed: false,
          ref: true,
        })
        state.components[componentId].props['ref'] = `{${ref}}`
      }
    },
  }
})

export const {
  addComponentBase,
  addComponentPayload,
  updateComponent,
  deleteComponent,
  setSelectedComponent,
  setHoveredComponent,
  moveComponent,
  moveSelectedComponentChildren,
  select,
  unselect,
  selectParent,
  duplicate,
  setComponentName,
  hover,
  unhover,
  sortHover,
  sortUnhover,
  reset,
  loadDemo,
  deleteProps,
  updateProps,
  deleteParams,
  resetProps,
  addComponent,
} = componentsSlice.actions

export default componentsSlice.reducer
