import { RootState } from '../../store/store'
import { createSelector } from '@reduxjs/toolkit'

const defaultTheme = {
  brand: 'cyan',
  primaryColor: 'blue.400',
  textColor: 'gray.900',
  bgColor: 'blackAlpha.100',
  paperColor: 'whiteAlpha.900',
  borderColor: 'gray.200',
  headingFontFamily: 'roboto',
  bodyFontFamily: 'roboto',
}

export const getCustomComponents = (state: RootState) =>
  state.customComponents.present.components

export const getNewTheme = (state: RootState) => 
  state.customComponents.present.newTheme || defaultTheme

export const getThemePath = (state: RootState) =>
  state.customComponents.present.themePath

export const getCustomComponentBy = (
  nameOrId: IComponent['type'] | IComponent['id'],
) => (state: RootState) => 
  state.customComponents.present.components[nameOrId]

export const getSelectedCustomComponentId = (state: RootState) =>
  state.customComponents.present.selectedCustomId

export const getIsSelectedCustomComponent = (
  componentId: IComponent['type'],
) => (state: RootState) => 
  state.customComponents.present.selectedCustomId === componentId

export const getCustomComponentNames = createSelector(
  [getCustomComponents],
  (components) => {
    if (!components) return []
    return Object.keys(components)
  }
)

export const getCustomComponentPaths = (state: RootState) =>
  Object.values(state.customComponents.present.components) 
