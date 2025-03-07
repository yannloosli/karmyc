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

interface Preset {
  id: string
  name: string
  root: ComponentState
  [key: string]: ComponentState | string
  createdAt?: string
  updatedAt?: string
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
    const detectionZone = 100 // Zone de détection augmentée à 100px

    // Calcul des distances avec une fonction exponentielle pour une transition plus douce
    const topDistance = Math.abs(hoverClientY)
    const bottomDistance = Math.abs(hoverClientY - hoverBoundingRect.height)

    // Fonction pour calculer l'opacité avec une courbe exponentielle
    const calculateVisibility = (distance: number) => {
      if (distance > detectionZone) return { isVisible: false, distance: 100 }
      const normalizedDistance = (distance / detectionZone) * 100
      const smoothDistance = Math.pow(normalizedDistance / 100, 2) * 100
      return { 
        isVisible: true, 
        distance: smoothDistance 
      }
    }

    setDropZones({
      top: calculateVisibility(topDistance),
      bottom: calculateVisibility(bottomDistance)
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
      if (!ref?.current || !monitor.isOver({ shallow: true })) {
        setDropZones({
          top: { isVisible: false, distance: 100 },
          bottom: { isVisible: false, distance: 100 }
        })
        return
      }

      const dragIndex = item.index || 0
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        setDropZones({
          top: { isVisible: false, distance: 100 },
          bottom: { isVisible: false, distance: 100 }
        })
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
        setDropZones({
          top: { isVisible: false, distance: 100 },
          bottom: { isVisible: false, distance: 100 }
        })
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        setDropZones({
          top: { isVisible: false, distance: 100 },
          bottom: { isVisible: false, distance: 100 }
        })
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
          // Vérifier d'abord dans les presets personnalisés en utilisant l'ID
          let preset = presets[item.id]
          
          // Si pas trouvé par ID, chercher par type dans les presets personnalisés
          if (!preset) {
            preset = presets[item.type]
          }
          
          // Si pas trouvé, chercher par nom dans les presets personnalisés
          if (!preset) {
            preset = Object.values(presets).find(p => p.name === item.type)
          }
          
          // Si toujours pas trouvé, chercher dans les presets par défaut
          if (!preset && defaultPresets[item.type]) {
            const defaultPreset = defaultPresets[item.type]
            const now = new Date().toISOString()
            
            // Convertir l'ancien format en nouveau format si nécessaire
            const root = defaultPreset.root || defaultPreset.rootComponents?.component
            const components = defaultPreset.rootComponents?.components || {}
            
            if (!root) {
              console.error('Default preset has no root component:', defaultPreset)
              return
            }

            preset = {
              id: item.type,
              name: item.type,
              root,
              ...Object.entries(components).reduce((acc, [key, value]) => {
                if (key !== 'root' && value && typeof value === 'object' && 'type' in value) {
                  acc[key] = value as ComponentState
                }
                return acc
              }, {} as Record<string, ComponentState>),
              createdAt: now,
              updatedAt: now
            }
          }

          if (preset) {           
            const component = preset.root
            if (!component) {
              console.error('Preset has no root component:', preset)
              return
            }

            // Générer un ID unique pour le nouveau composant
            const generateUniqueId = (componentType: string): string => {
              return `${componentType}-${generateUUID()}`
            }

            // Map pour stocker les correspondances entre anciens et nouveaux IDs
            const idMapping = new Map<string, string>()

            // Fonction pour obtenir ou générer un nouvel ID
            const getNewId = (oldId: string, componentType: string): string => {
              if (idMapping.has(oldId)) {
                return idMapping.get(oldId)!
              }
              const newId = generateUniqueId(componentType)
              idMapping.set(oldId, newId)
              return newId
            }

            // Créer une copie du composant avec un nouvel ID
            const newComponentId = getNewId('root', component.type)
            
            // Générer les nouveaux IDs des enfants du composant racine
            const newRootChildrenIds = component.children.map(childId => {
              const child = preset[childId]
              return typeof child === 'string' ? childId : getNewId(childId, child.type)
            })

            // Ajouter le composant racine
            dispatch(addComponent({
              id: newComponentId,
              type: component.type,
              parentName: componentId,
              rootParentType: component.rootParentType,
              isExisting: true,
              component: {
                ...component,
                id: newComponentId,
                parent: componentId,
                children: newRootChildrenIds
              }
            }))

            // Fonction récursive pour ajouter les composants dans l'ordre
            const addComponentsInOrder = (componentId: string) => {
              const currentComponent = preset[componentId]
              if (!currentComponent || typeof currentComponent === 'string') return

              // Créer une copie du composant avec un nouvel ID
              const newId = getNewId(componentId, currentComponent.type)
              const parentComponent = preset[currentComponent.parent || '']
              const newParentId = componentId === 'root' ? newComponentId : 
                (parentComponent && typeof parentComponent !== 'string' ? 
                  getNewId(currentComponent.parent || '', parentComponent.type) : componentId)

              // Générer et stocker les nouveaux IDs des enfants
              const newChildrenIds = currentComponent.children.map(childId => {
                const child = preset[childId]
                return typeof child === 'string' ? childId : getNewId(childId, child.type)
              })

              dispatch(addComponent({
                id: newId,
                type: currentComponent.type,
                parentName: newParentId,
                rootParentType: currentComponent.rootParentType,
                isExisting: true,
                component: {
                  ...currentComponent,
                  id: newId,
                  parent: newParentId,
                  children: newChildrenIds
                }
              }))

              // Ajouter récursivement les enfants en utilisant les nouveaux IDs
              currentComponent.children.forEach((childId, index) => {
                const child = preset[childId]
                if (typeof child !== 'string') {
                  addComponentsInOrder(childId)
                }
              })
            }

            // Ajouter les composants enfants dans l'ordre
            component.children.forEach(childId => {
              addComponentsInOrder(childId)
            })
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
