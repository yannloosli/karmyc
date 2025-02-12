import { RootState } from 'src/core/store'

export const getShowLayout = (state: RootState) => state.app.showLayout

export const getShowLoader = (state: RootState) => state.app.showLoader

export const getFocusedComponent = (id: IComponent['id']) => (
  state: RootState,
) => state.app.inputTextFocused && state.components.present.selectedId === id

export const getInputTextFocused = (state: RootState) =>
  state.app.inputTextFocused

export const getEditorWidth = (state: RootState) => state.app.editorWidth
