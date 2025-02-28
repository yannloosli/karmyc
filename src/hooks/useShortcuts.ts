import { useAppDispatch } from '../hooks/useAppDispatch'
import { useSelector } from 'react-redux'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import { getSelectedComponent } from '../store/selectors/components'
import { deleteComponent, unselect, selectParent, duplicate, loadDemo } from '../store/slices/componentsSlice'
import { appSlice } from '../store/slices/appSlice'
import { useHotkeys } from 'react-hotkeys-hook'

const keyMap = {
  DELETE_NODE: 'Backspace, del',
  TOGGLE_BUILDER_MODE: 'b',
  UNDO: 'ctrl+z, command+z',
  REDO: 'ctrl+y, cmd+y',
  UNSELECT: 'esc',
  PARENT: 'p',
  DUPLICATE: 'ctrl+d, command+d',
  KONAMI_CODE:
    'up up down down left right left right b a, up up down down left right left right B A',
}

const hasNoSpecialKeyPressed = (event: KeyboardEvent | undefined) =>
  !event?.metaKey && !event?.shiftKey && !event?.ctrlKey && !event?.altKey

const useShortcuts = () => {
  const dispatch = useAppDispatch()
  const selected = useSelector(getSelectedComponent)

  const deleteNode = (event: KeyboardEvent | undefined) => {
    if (event) {
      event.preventDefault()
    }
    if (selected?.id) {
      dispatch(deleteComponent(selected.id))
    }
  }

  const toggleBuilderMode = (event: KeyboardEvent | undefined) => {
    if (event && hasNoSpecialKeyPressed(event)) {
      event.preventDefault()
      dispatch(appSlice.actions.toggleBuilderMode())
    }
  }

  const undo = (event: KeyboardEvent | undefined) => {
    if (event) {
      event.preventDefault()
    }

    dispatch(UndoActionCreators.undo())
  }

  const redo = (event: KeyboardEvent | undefined) => {
    if (event) {
      event.preventDefault()
    }

    dispatch(UndoActionCreators.redo())
  }

  const onUnselect = () => {
    dispatch(unselect())
  }

  const onSelectParent = (event: KeyboardEvent | undefined) => {
    if (event && hasNoSpecialKeyPressed(event)) {
      event.preventDefault()
      dispatch(selectParent())
    }
  }

  const onDuplicate = (event: KeyboardEvent | undefined) => {
    if (event) {
      event.preventDefault()
    }
    dispatch(duplicate())
  }

  const onKonamiCode = () => {
    dispatch(loadDemo('secretchakra'))
  }

  useHotkeys(keyMap.DELETE_NODE, deleteNode, {}, [selected?.id])
  useHotkeys(keyMap.TOGGLE_BUILDER_MODE, toggleBuilderMode)
  useHotkeys(keyMap.UNDO, undo)
  useHotkeys(keyMap.REDO, redo)
  useHotkeys(keyMap.UNSELECT, onUnselect)
  useHotkeys(keyMap.PARENT, onSelectParent)
  useHotkeys(keyMap.DUPLICATE, onDuplicate)
  useHotkeys(keyMap.KONAMI_CODE, onKonamiCode)
}

export default useShortcuts
