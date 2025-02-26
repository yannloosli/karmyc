import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type Overlay = undefined | { rect: DOMRect; id: string; type: ComponentType }

// Définition du type pour le state
interface AppState {
    showLayout: boolean
    showLoader: boolean
    inputTextFocused: boolean
    editorWidth: string
    overlay: undefined | Overlay
    theme: 'light' | 'dark'
    isLoading: boolean
}

// État initial
const initialState: AppState = {
    showLayout: true,
    showLoader: false,
    inputTextFocused: false,
    editorWidth: '100%',
    overlay: undefined,
    theme: 'light',
    isLoading: false
}

// Création du slice
export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleBuilderMode: (state) => {
      state.showLayout = !state.showLayout
    },
    toggleLoader: (state) => {
      state.showLoader = !state.showLoader
    },
    toggleInputText: (state, action: PayloadAction<boolean>) => {
      state.inputTextFocused = action.payload
    },
    setOverlay: (state, action: PayloadAction<Overlay | undefined>) => {
      state.overlay = action.payload
    },
    updateEditorWidth: (state, action: PayloadAction<{ width: string }>) => {
      state.editorWidth = action.payload.width
    },
    clearOverlay: (state) => {
      state.overlay = undefined
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase('components/deleteComponent', (state) => {
        state.overlay = undefined
      })
      .addCase('@@redux-undo/UNDO', (state) => {
        state.overlay = undefined
      })
  }
})

// Export des actions
export const {
  toggleBuilderMode,
  toggleLoader,
  toggleInputText,
  setOverlay,
  updateEditorWidth,
  clearOverlay,
  setTheme,
  setLoading
} = appSlice.actions

// Export du reducer
export default appSlice.reducer
