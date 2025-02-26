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
      children: [],
      parent: null,
      componentName: 'Root'
    }
  },
  selectedId: 'root',
  hoveredId: null,
  rootComponents: [],
  sortHoveredId: undefined,
  sortPosition: undefined
}

const createMetaComponent = (
  components: Record<string, ComponentState>,
  componentId: string,
  type: string,
  rootParentType?: string,
) => {
  if (!components[componentId]) {
    components[componentId] = {
      id: componentId,
      type,
      props: {},
      children: [],
      parent: '',
      rootParentType,
    }
  }
  return components
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

    moveComponent: (state, action: PayloadAction<{ parentId: string; componentId: string }>) => {
      const { parentId, componentId } = action.payload
      if (state.components[componentId].parent === parentId || parentId === componentId) return

      const previousParentId = state.components[componentId].parent
      state.components[previousParentId].children = 
        state.components[previousParentId].children.filter(id => id !== componentId)

      state.components[componentId].parent = parentId
      state.components[parentId].children.push(componentId)
    },

    moveSelectedComponentChildren: (state, action: PayloadAction<{
      droppedId: string
      targetId: string
      position: 'top' | 'bottom'
    }>) => {
      const { droppedId, targetId, position } = action.payload
      const targetParentId = state.components[targetId].parent
      const droppedParentId = state.components[droppedId].parent

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
      type: ComponentType
      rootParentType?: ComponentType
      testId?: string
    }>) => {
      const { parentName, type, rootParentType, testId } = action.payload
      const id = testId || generateId(type)
      const { form, ...defaultProps } = DEFAULT_PROPS[type] || {}

      state.selectedId = id
      state.components[parentName].children.push(id)
      state.components[id] = {
        id,
        props: defaultProps || {},
        children: [],
        type,
        parent: parentName,
        rootParentType: rootParentType || type,
      }

      if (componentsWithRefs.includes(type)) {
        const ref = `ref${id.replace('-', '_')}`
        if (!state.components['root'].params) {
          state.components['root'].params = []
        }
        state.components['root'].params.push({
          name: ref,
          type: `RefObject<${ComponentWithRefs[type]}>`,
          value: 'null',
          optional: true,
          exposed: false,
          ref: true,
        })
        state.components[id].props['ref'] = `{${ref}}`
      }
    },

    addMetaComponent: (state, action: PayloadAction<{
      components: IComponents
      root: string
      parent: string
    }>) => {
      const { components: newComponents, root, parent } = action.payload
      
      state.selectedId = root
      state.components[parent].children.push(root)
      state.components = { ...state.components, ...newComponents }

      const newRefElements = Object.entries(state.components)
        .filter(([id, comp]) => 
          componentsWithRefs.includes(comp.type) && 
          state.components[root].children.includes(id)
        )

      newRefElements.forEach(([id, comp]) => {
        const ref = `ref${id.replace('-', '_')}`
        if (!state.components['root'].params) {
          state.components['root'].params = []
        }
        state.components['root'].params.push({
          name: ref,
          type: `RefObject<${ComponentWithRefs[comp.type]}>`,
          value: 'null',
          optional: true,
          exposed: false,
          ref: true,
        })
        state.components[id].props['ref'] = `{${ref}}`
      })
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

      state.components = createMetaComponent(
        state.components,
        componentId,
        type,
        rootParentType,
      )

      state.components[componentId].parent = parentId
      state.components[parentId].children.push(componentId)
      state.selectedId = componentId
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
  addMetaComponent,
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
