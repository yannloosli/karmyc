import { useDrop, DropTargetMonitor, XYCoord } from 'react-dnd'
import { useSelector } from 'react-redux'
import { getSortPosition } from '@/store/selectors/components'
import { RootState } from '../store/store'
import { rootComponents } from 'src/utils/editor'
import { useAppDispatch } from '../store/hooks'
import { DEFAULT_PROPS } from 'src/utils/defaultProps'
import {
  getCustomComponentNames,
} from '@/store/selectors/customComponents'
import { 
  sortUnhover, 
  sortHover, 
  moveComponent, 
  addComponentPayload as addComponent,
  moveSelectedComponentChildren,
  addComponentBase,
  ComponentState
} from '../store/slices/componentsSlice'
import { useState, useEffect } from 'react'
import { defaultPresets } from '../presets'

interface DropZone {
  isVisible: boolean
  distance: number
}

interface DropZones {
  top: DropZone
  bottom: DropZone
}

// Fonction pour générer un UUID unique
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useDropComponent = (
  componentId: string,
  index: number,
  ref: any,
  accept: ComponentType[] = rootComponents,
  canDrop: boolean = true,
) => {
  const dispatch = useAppDispatch()
  const customComponents = useSelector(getCustomComponentNames)
  const presets = useSelector((state: RootState) => state.presets.presets)
  const isSortHovered = useSelector((state: RootState) =>
    Boolean(state.components.present.sortHoveredId),
  )
  const sortPosition = useSelector(getSortPosition()) as 'top' | 'bottom'

  const [dropZones, setDropZones] = useState<DropZones>({
    top: { isVisible: false, distance: 100 },
    bottom: { isVisible: false, distance: 100 }
  })

  const moveChildren = (
    droppedId: string,
    targetId: string,
    position: 'top' | 'bottom',
  ) => {
    dispatch(moveSelectedComponentChildren({ droppedId, targetId, position }))
  }

  const updateDropZones = (clientOffset: XYCoord | null, hoverBoundingRect: DOMRect) => {
    if (!clientOffset) {
      setDropZones({
        top: { isVisible: false, distance: 100 },
        bottom: { isVisible: false, distance: 100 }
      })
      return
    }

    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    const topDistance = Math.abs(hoverClientY)
    const bottomDistance = Math.abs(hoverClientY - hoverBoundingRect.height)

    setDropZones({
      top: {
        isVisible: topDistance < 50,
        distance: Math.min(topDistance, 100)
      },
      bottom: {
        isVisible: bottomDistance < 50,
        distance: Math.min(bottomDistance, 100)
      }
    })
  }

  const [{ isOver }, drop] = useDrop({
    accept: [
      ...accept,
      ...customComponents,
      ...Object.keys(presets),
      ...Object.keys(defaultPresets)
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

      updateDropZones(clientOffset, hoverBoundingRect)

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
      } else {
        try {
          // Vérifier d'abord dans les presets personnalisés
          let preset = presets[item.type]
          
          // Si pas trouvé, chercher dans les presets par défaut
          if (!preset && defaultPresets[item.type]) {
            preset = defaultPresets[item.type]
          }

          if (preset) {
            // Cas d'un composant avec preset
            if (!preset.component || !preset.components) {
              console.error('Preset structure is invalid:', preset)
              return
            }

            // Générer de nouveaux IDs pour tous les composants
            const idMapping: Record<string, string> = {}
            const instanceId = generateUUID()
            const usedIds = new Set<string>()

            // Fonction pour générer un ID unique
            const generateUniqueId = (componentType: string): string => {
              let counter = 0
              let newId: string
              do {
                newId = `${componentType}-${instanceId}-${counter++}`
              } while (usedIds.has(newId))
              usedIds.add(newId)
              return newId
            }

            // Générer des IDs pour tous les composants
            Object.keys(preset.components).forEach(oldId => {
              const component = preset.components[oldId]
              if (component) {
                idMapping[oldId] = generateUniqueId(component.type)
              }
            })

            // Mettre à jour tous les composants avec leurs nouveaux IDs et références
            const updatedComponents: Record<string, ComponentState> = {}
            const processedIds = new Set<string>()

            // Fonction récursive pour traiter les composants
            const processComponent = (oldId: string) => {
              if (processedIds.has(oldId)) return
              processedIds.add(oldId)

              const component = preset.components[oldId]
              if (!component) return

              const newId = idMapping[oldId]
              if (!newId) return

              const newParentId = component.parent === '' ? componentId : idMapping[component.parent] || ''
              const newChildren = Array.isArray(component.children) 
                ? component.children.map(childId => idMapping[childId] || childId)
                : []

              // Ne pas dupliquer les enfants
              const uniqueChildren = [...new Set(newChildren)]

              updatedComponents[newId] = {
                ...component,
                id: newId,
                parent: newParentId,
                children: uniqueChildren,
              }
            }

            // Traiter tous les composants une seule fois
            Object.keys(preset.components).forEach(oldId => {
              processComponent(oldId)
            })

            // Ajouter tous les composants au store dans l'ordre correct
            const addComponentsInOrder = (componentId: string) => {
              const component = updatedComponents[componentId]
              if (!component) return

              // Ajouter d'abord les enfants
              component.children.forEach(childId => {
                addComponentsInOrder(childId)
              })

              // Puis ajouter le composant lui-même
              dispatch(addComponentBase({
                id: componentId,
                component
              }))
            }

            // Commencer par le composant racine
            const rootComponentId = Object.keys(preset.components).find(id => !preset.components[id].parent)
            if (rootComponentId) {
              addComponentsInOrder(idMapping[rootComponentId])
            }
          } else {
            // Cas d'un composant de base (Box, Flex, etc.)
            dispatch(addComponent({
              parentName: componentId,
              type: item.type,
              rootParentType: item.rootParentType,
            }))
          }

        } catch (error) {
          console.error('Error adding component:', error)
          console.error('Error details:', {
            item,
            presets,
            defaultPresets
          })
        }
      }

      setDropZones({
        top: { isVisible: false, distance: 100 },
        bottom: { isVisible: false, distance: 100 }
      })
    },
    canDrop: () => canDrop,
  })

  useEffect(() => {
    if (!isOver) {
      setDropZones({
        top: { isVisible: false, distance: 100 },
        bottom: { isVisible: false, distance: 100 }
      })
    }
  }, [isOver])

  return { drop, isOver, dropZones }
}
