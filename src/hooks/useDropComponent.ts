import { useDrop, DropTargetMonitor, XYCoord } from 'react-dnd'
import { useSelector } from 'react-redux'
import builder from 'src/core/models/composer/builder'
import { getSortPosition } from '@/store/selectors/components'
import { RootState } from '../store/store'
import { rootComponents } from 'src/utils/editor'
import { useAppDispatch } from '../store/hooks'
import {
  getCustomComponentNames,
} from '@/store/selectors/customComponents'
import { 
  sortUnhover, 
  sortHover, 
  moveComponent, 
  addMetaComponent, 
  addComponentPayload as addComponent,
  moveSelectedComponentChildren 
} from '../store/slices/componentsSlice'

export const useDropComponent = (
  componentId: string,
  index: number,
  ref: any,
  accept: (ComponentType | MetaComponentType)[] = rootComponents,
  canDrop: boolean = true,
) => {
  const dispatch = useAppDispatch()
  const customComponents = useSelector(getCustomComponentNames)
  const isSortHovered = useSelector((state: RootState) =>
    Boolean(state.components.present.sortHoveredId),
  )
  const sortPosition = useSelector(getSortPosition()) as 'top' | 'bottom'

  const moveChildren = (
    droppedId: string,
    targetId: string,
    position: 'top' | 'bottom',
  ) => {
    dispatch(moveSelectedComponentChildren({ droppedId, targetId, position }))
  }

  const [{ isOver }, drop] = useDrop({
    accept: [
      ...accept,
      ...customComponents,
    ],
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
    hover: (item: ComponentItemProps, monitor) => {
      if (!ref?.current) {
        return
      }
      const dragIndex = item.index || 0
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      dispatch(sortUnhover())

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      if (dragIndex <= hoverIndex) {
        dispatch(sortHover({
          componentId,
          position: 'bottom',
        }))
      }

      if (dragIndex > hoverIndex) {
        dispatch(sortHover({
          componentId,
          position: 'top',
        }))
      }
    },
    drop: (item: ComponentItemProps, monitor: DropTargetMonitor) => {
      if (!monitor.isOver()) {
        return
      }
      dispatch(sortUnhover())

      const droppedId = item.id

      if (item.isMoved) {
        if (isSortHovered) {
          moveChildren(droppedId, componentId, sortPosition)
        } else {
          dispatch(moveComponent({
            parentId: componentId,
            componentId: item.id,
          }))
        }
      } else if (item.isMeta) {
        dispatch(addMetaComponent(builder[item.type](componentId)))
      } else {
        dispatch(addComponent({
          parentName: componentId,
          type: item.type,
          rootParentType: item.rootParentType,
        }))
      }
    },
    canDrop: () => canDrop,
  })

  return { drop, isOver }
}
