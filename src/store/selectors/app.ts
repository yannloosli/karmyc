import { RootState } from '../../store/store'

export const getShowLayout = (state: RootState) => state.app.present.showLayout

export const getShowLoader = (state: RootState) => state.app.present.showLoader

export const getFocusedComponent = (id: IComponent['id']) => (
  state: RootState,
) => state.app.present.inputTextFocused && state.components.present.selectedId === id

export const getInputTextFocused = (state: RootState) =>
  state.app.present.inputTextFocused

export const getEditorWidth = (state: RootState) => state.app.present.editorWidth 
