import { createModel } from '@rematch/core'

type Overlay = undefined | { rect: DOMRect; id: string; type: ComponentType }

export type AppState = {
  showLayout: boolean
  showLoader: boolean
  inputTextFocused: boolean
  editorWidth: string
  overlay: undefined | Overlay
}

const app = createModel({
  state: {
    showLayout: true,
    showLoader: false,
    inputTextFocused: false,
    editorWidth: '100%',
    overlay: undefined,
  } as AppState,
  reducers: {
    toggleBuilderMode(state: AppState): AppState {
      return {
        ...state,
        showLayout: !state.showLayout,
      }
    },
    toggleLoader(state: AppState): AppState {
      return {
        ...state,
        showLoader: !state.showLoader,
      }
    },
    toggleInputText(state: AppState): AppState {
      return {
        ...state,
        inputTextFocused: !state.inputTextFocused,
      }
    },
    setOverlay(state: AppState, overlay: Overlay | undefined): AppState {
      return {
        ...state,
        overlay,
      }
    },
    updateEditorWidth(state: AppState, payload: { width: string }): AppState {
      return {
        ...state,
        editorWidth: payload.width,
      }
    },
    'components/deleteComponent': (state: AppState): AppState => {
      return {
        ...state,
        overlay: undefined,
      }
    },
    '@@redux-undo/UNDO': (state: AppState): AppState => {
      return {
        ...state,
        overlay: undefined,
      }
    },
  },
})

export default app
