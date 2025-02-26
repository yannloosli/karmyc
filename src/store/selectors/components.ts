import map from 'lodash/map'
import { RootState } from '../store'
import { createSelector } from '@reduxjs/toolkit'

export const getComponents = (state: RootState) => state.components.present.components

export const getComponentBy = (nameOrId: string | IComponent['id']) => (
  state: RootState,
) => state.components.present.components[nameOrId]

export const getSelectedComponentId = (state: RootState) => state.components.present.selectedId

export const getSelectedComponent = createSelector(
  [getComponents, getSelectedComponentId],
  (components, selectedId) => selectedId ? components[selectedId] : components['root']
)

export const getComponentParams = (state: RootState) =>
  state.components.present.components['root'].params

export const getComponentParamNames = createSelector(
  [(state: RootState) => state.components.present.components['root'].params || []],
  (params) => params.map(param => param.name)
)

export const getPropsForSelectedComponent = (
  state: RootState,
  propsName: string,
) =>
  state.components.present.components[state.components.present.selectedId]
    .props[propsName]

export const getIsSelectedComponent = (componentId: IComponent['id']) => (
  state: RootState,
) => state.components.present.selectedId === componentId

export const getSelectedComponentChildren = createSelector(
  [getComponents, getSelectedComponent],
  (components, selectedComponent) => {
    if (!selectedComponent) return []
    return selectedComponent.children.map(childId => ({
      ...components[childId],
      id: childId
    }))
  }
)

export const getSelectedComponentParent = (state: RootState) =>
  state.components.present.components[getSelectedComponent(state).parent]

export const getHoveredId = (state: RootState) =>
  state.components.present.hoveredId

export const getIsHovered = (id: IComponent['id']) => (state: RootState) =>
  getHoveredId(state) === id

export const getIsSortHovered = (id: IComponent['id']) => (state: RootState) =>
  state.components.present.sortHoveredId === id

export const getSortPosition = () => (state: RootState) =>
  state.components.present.sortPosition

export const getComponentNames = createSelector(
  [getComponents],
  (components) => Object.values(components)
    .filter(component => component.componentName)
    .map(component => component.componentName)
) 
