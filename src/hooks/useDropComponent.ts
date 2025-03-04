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
  addComponent,
  moveSelectedComponentChildren,
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

interface ComponentPreset {
  id: string
  name: string
  component: ComponentState
  components: Record<string, ComponentState>
  createdAt?: string
  updatedAt?: string
}

interface RootComponentsPreset {
  id: string
  name: string
  rootComponents: {
    component: ComponentState
    components: Record<string, ComponentState>
  }
  createdAt?: string
  updatedAt?: string
}

type Preset = ComponentPreset | RootComponentsPreset

const isRootComponentsPreset = (preset: Preset): preset is RootComponentsPreset => {
  return 'rootComponents' in preset
}

const isComponentPreset = (preset: Preset): preset is ComponentPreset => {
  return 'component' in preset && 'components' in preset
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
          console.log('Drop item:', item)
          // Vérifier d'abord dans les presets personnalisés en utilisant l'ID
          let preset = presets[item.id]
          console.log('Found preset by id:', preset)
          
          // Si pas trouvé par ID, chercher par type dans les presets personnalisés
          if (!preset) {
            preset = presets[item.type]
            console.log('Found preset by type:', preset)
          }
          
          // Si pas trouvé, chercher par nom dans les presets personnalisés
          if (!preset) {
            preset = Object.values(presets).find(p => p.name === item.type)
            console.log('Found preset by name:', preset)
          }
          
          // Si toujours pas trouvé, chercher dans les presets par défaut
          if (!preset && defaultPresets[item.type]) {
            const now = new Date().toISOString()
            preset = {
              id: item.type,
              name: item.type,
              rootComponents: defaultPresets[item.type].rootComponents,
              createdAt: now,
              updatedAt: now
            }
            console.log('Created preset from default:', preset)
          }

          if (preset) {
            console.log('Using preset:', preset)
            
            // Extraire les composants et le composant racine
            let components: Record<string, ComponentState>
            let component: ComponentState

            if (isRootComponentsPreset(preset)) {
              if (!preset.rootComponents) {
                console.error('Preset has no rootComponents:', preset)
                return
              }
              components = preset.rootComponents.components
              component = preset.rootComponents.component
            } else {
              const componentPreset = preset as ComponentPreset
              if (!componentPreset.components || !componentPreset.component) {
                console.error('Invalid preset structure:', preset)
                return
              }
              components = componentPreset.components
              component = componentPreset.component
            }

            if (!components || !component) {
              console.error('Invalid preset structure:', preset)
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
            Object.keys(components).forEach(oldId => {
              const component = components[oldId] as ComponentState
              if (component) {
                idMapping[oldId] = generateUniqueId(component.type)
              }
            })

            // Mettre à jour tous les composants avec leurs nouveaux IDs et références
            const updatedComponents: Record<string, ComponentState> = {}
            Object.entries(components).forEach(([oldId, component]) => {
              const newId = idMapping[oldId]
              const typedComponent = component as ComponentState
              if (newId && typedComponent) {
                updatedComponents[newId] = {
                  ...typedComponent,
                  id: newId,
                  parent: typedComponent.parent === "root" ? componentId : idMapping[typedComponent.parent] || typedComponent.parent,
                  children: typedComponent.children.map(childId => idMapping[childId] || childId)
                }
              }
            })

            // Trouver l'ID du composant racine
            const rootComponentId = Object.keys(components).find(
              id => (components[id] as ComponentState)?.parent === "root"
            )

            // Ajouter tous les composants au store dans l'ordre correct
            const addComponentsInOrder = (componentId: string) => {
              const component = updatedComponents[componentId]
              if (!component) return

              // D'abord ajouter le composant lui-même
              dispatch(addComponent({
                id: componentId,
                type: component.type,
                parentName: component.parent || 'root',
                isExisting: true,
                component
              }))

              // Puis ajouter les enfants
              component.children.forEach(childId => {
                addComponentsInOrder(childId)
              })
            }

            // Commencer par le composant racine
            if (rootComponentId && idMapping[rootComponentId]) {
              addComponentsInOrder(idMapping[rootComponentId])
            }
          } else {
            // Cas d'un composant de base (Box, Flex, etc.)
            dispatch(addComponent({
              parentName: componentId,
              type: item.type,
              rootParentType: item.rootParentType,
              isExisting: false
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
