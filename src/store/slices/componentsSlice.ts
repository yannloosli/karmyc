import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_PROPS } from 'src/utils/defaultProps'
import { generateId } from 'src/utils/generateId'
import { duplicateComponent } from 'src/utils/recursive'
import { ComponentWithRefs } from 'src/custom-components/refComponents'

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
    addComponent: (state, action: PayloadAction<{
      id?: string
      type: string
      parentName: string
      rootParentType?: string
      isExisting?: boolean
      component?: ComponentState
      index?: number
    }>) => {
      const { parentName, type, rootParentType, isExisting, component, index } = action.payload
      const id = action.payload.id || generateId(type)

      // Si c'est un composant existant
      if (isExisting && component) {
        state.components[id] = component
        
        if (!component.parent) {
          if (!state.rootComponents.includes(id)) {
            state.rootComponents.push(id)
          }
        } else if (state.components[component.parent]) {
          if (!state.components[component.parent].children.includes(id)) {
            state.components[component.parent].children.push(id)
          }
        }
        return
      }

      // Si c'est un nouveau composant
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

      // Ajouter le composant aux enfants du parent
      if (typeof index === 'number') {
        state.components[parentName].children.splice(index, 0, id)
      } else {
        state.components[parentName].children.push(id)
      }

      // Gérer les refs si nécessaire
      if (componentsWithRefs.includes(type)) {
        const ref = `ref${id.replace('-', '_')}`
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
        state.components[id].props['ref'] = `{${ref}}`
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

        // Vérifier s'il reste des composants autres que root
        const remainingComponents = Object.keys(state.components).filter(key => key !== 'root')
        if (remainingComponents.length === 0) {
          // Recréer le conteneur par défaut
          const defaultContainer = {
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
          state.components['default-container'] = defaultContainer
          state.components.root.children = ['default-container']
          state.selectedId = 'default-container'
        }
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
  }
})

export const {
  addComponent,
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
  deleteProps,
  updateProps,
  deleteParams,
  resetProps,
} = componentsSlice.actions

export default componentsSlice.reducer
