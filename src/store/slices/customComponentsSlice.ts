import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types pour les composants personnalisés
export interface CustomComponent {
  id: string
  name: string
  description?: string
  template: string
  props: {
    name: string
    type: string
    defaultValue?: any
    required?: boolean
    description?: string
  }[]
  metadata?: {
    createdAt: string
    updatedAt: string
    version?: string
    tags?: string[]
  }
}

export interface CustomDictionary {
  [Key: string]: CustomComponent
}

export interface NewThemeType {
  brand: string
  primaryColor: string
  textColor: string
  bgColor: string
  paperColor: string
  borderColor: string
  headingFontFamily: string
  bodyFontFamily: string
}

interface CustomComponentsState {
  components: Record<string, CustomComponent>
  selectedCustomId: string | null
  newTheme?: NewThemeType
  themePath?: string
}

const DEFAULT_ID = undefined
const INITIAL_COMPONENTS: Record<string, CustomComponent> = {}
const DEFAULT_THEME_PATH = undefined
const INITIAL_NEW_THEME: NewThemeType = {
  brand: 'cyan',
  primaryColor: 'blue.400',
  textColor: 'gray.900',
  bgColor: 'blackAlpha.100',
  paperColor: 'whiteAlpha.900',
  borderColor: 'gray.200',
  headingFontFamily: 'roboto',
  bodyFontFamily: 'roboto',
}

const initialState: CustomComponentsState = {
  components: {},
  selectedCustomId: null,
  newTheme: undefined,
  themePath: undefined
}

export const customComponentsSlice = createSlice({
  name: 'customComponents',
  initialState,
  reducers: {
    updateCustomComponents: (state, action: PayloadAction<Record<string, CustomComponent>>) => {
      state.components = action.payload
    },

    addCustomComponent: (state, action: PayloadAction<{
      component: string
      componentPath: string
    }>) => {
      const { component, componentPath } = action.payload
      state.components[component] = {
        id: component,
        name: component,
        template: componentPath,
        props: []
      }
    },

    deleteCustomComponent: (state, action: PayloadAction<string>) => {
      delete state.components[action.payload]
    },

    reset: (state, action: PayloadAction<CustomDictionary | undefined>) => {
      state.components = action.payload || INITIAL_COMPONENTS
      state.selectedCustomId = null
    },

    select: (state, action: PayloadAction<IComponent['type']>) => {
      state.selectedCustomId = action.payload
    },

    unselect: (state) => {
      state.selectedCustomId = null
    },

    setTheme: (state, action: PayloadAction<{
      themePath: string
      newTheme: NewThemeType
    }>) => {
      const { themePath, newTheme } = action.payload
      state.themePath = themePath
      state.newTheme = newTheme
    },

    updateNewTheme: (state, action: PayloadAction<{
      propType: keyof NewThemeType
      value?: string
      fullThemeColor?: string
    }>) => {
      const { propType, value, fullThemeColor } = action.payload
      state.newTheme[propType] = value || fullThemeColor
    },
  },
})

export const {
  updateCustomComponents,
  addCustomComponent,
  deleteCustomComponent,
  reset,
  select,
  unselect,
  setTheme,
  updateNewTheme,
} = customComponentsSlice.actions

export default customComponentsSlice.reducer
