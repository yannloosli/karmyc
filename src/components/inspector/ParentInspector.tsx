import React from 'react'
import { useSelector } from 'react-redux'
import { getSelectedComponentParent } from '@/store/selectors/components'
import ElementListItem from 'src/components/inspector/elements-list/ElementListItem'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { select, hover, unhover } from '@/store/slices/componentsSlice'

const ParentInspector = () => {
  const parentComponent = useSelector(getSelectedComponentParent)
  const dispatch = useAppDispatch()

  if (!parentComponent) {
    return null
  }

  const onSelect = () => {
    dispatch(select(parentComponent.id))
  }

  const onHover = () => {
    dispatch(hover(parentComponent.id))
  }

  const onUnhover = () => {
    dispatch(unhover())
  }

  return (
    <ElementListItem
      type={parentComponent.type}
      onMouseOver={onHover}
      onMouseOut={onUnhover}
      onSelect={onSelect}
    />
  )
}

export default ParentInspector
