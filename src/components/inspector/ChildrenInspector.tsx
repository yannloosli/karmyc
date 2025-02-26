import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getSelectedComponentChildren } from '@/store/selectors/components'
import ElementsList from './elements-list/ElementsList'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { hover, unhover, select, moveSelectedComponentChildren } from '../../store/slices/componentsSlice'

const ChildrenInspector: React.FC = () => {
  const childrenComponent = useSelector(getSelectedComponentChildren)
  const dispatch = useAppDispatch()

  const moveChildren = useCallback((
    componentId: string,
    fromIndex: number,
    toIndex: number,
  ) => {
    dispatch(moveSelectedComponentChildren({
      droppedId: componentId,
      targetId: childrenComponent[toIndex].id,
      position: fromIndex > toIndex ? 'top' : 'bottom'
    }))
  }, [dispatch, childrenComponent])

  const onSelectChild = useCallback((id: string) => {
    dispatch(select(id))
  }, [dispatch])

  const onHoverChild = useCallback((id: string | null) => {
    if (id) {
      dispatch(hover(id))
    } else {
      dispatch(unhover())
    }
  }, [dispatch])

  const onUnhoverChild = useCallback(() => {
    dispatch(unhover())
  }, [dispatch])

  return (
    <ElementsList
      elements={childrenComponent}
      moveItem={moveChildren}
      onSelect={onSelectChild}
      onHover={onHoverChild}
      onUnhover={onUnhoverChild}
    />
  )
}

export default ChildrenInspector
