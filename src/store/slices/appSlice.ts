import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Rect {
  x: number
  y: number
  width: number
  height: number
  top: number
  left: number
  bottom: number
  right: number
}

interface AppState {
  editorWidth: string
  showLayout: boolean
  showLoader: boolean
  inputTextFocused: boolean
  overlay: {
    rect: Rect
    id: string
    type: string
  }
  theme: 'light' | 'dark'
  isLoading: boolean
}

// État initial
const initialState: AppState = {
    editorWidth: '100%',
    showLayout: false,
    showLoader: false,
    inputTextFocused: false,
    overlay: {
        rect: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        },
        id: '',
        type: ''
    },
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
    setOverlay: (state, action: PayloadAction<{
      rect: Rect
      id: string
      type: string
    }>) => {
      const { rect, id, type } = action.payload
      state.overlay = {
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right
        },
        id,
        type
      }
    },
    updateEditorWidth: (state, action: PayloadAction<{ width: string }>) => {
      state.editorWidth = action.payload.width
    },
    clearOverlay: (state) => {
      state.overlay = initialState.overlay
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
        state.overlay = initialState.overlay
      })
      .addCase('@@redux-undo/UNDO', (state) => {
        state.overlay = initialState.overlay
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
