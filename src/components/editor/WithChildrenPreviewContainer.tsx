import React, { FunctionComponent, ComponentClass, useCallback, MutableRefObject, forwardRef } from 'react'
import { useInteractive } from 'src/hooks/useInteractive'
import { useDropComponent } from 'src/hooks/useDropComponent'
import ComponentPreview from './ComponentPreview'
import { Box } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { getComponentBy } from '@/store/selectors/components'
import * as Chakra from '@chakra-ui/react'

const WithChildrenPreviewContainer = forwardRef<HTMLDivElement, {
  component: IComponent
  type: string | FunctionComponent<any> | ComponentClass<any, any>
  enableVisualHelper?: boolean
  isBoxWrapped?: boolean
  index: number
  children?: React.ReactNode
}>(({
  component,
  type,
  enableVisualHelper = false,
  isBoxWrapped,
  index,
  children,
  ...forwardedProps
}, forwardedRef) => {
  const { props, ref } = useInteractive(component, index, enableVisualHelper)
  const { drop, isOver, dropZones } = useDropComponent(component.id, index, ref)
  console.log("===============>",component.children, children)
  // Filtrer la prop componentName
  const { componentName, ...cleanProps } = props
  const propsElement = { 
    ...cleanProps, 
    ...forwardedProps,
    // Déplacer les props de style dans l'objet style
    style: {
      position: 'relative',
      transition: 'all 0.2s ease-in-out',
      boxShadow: props.boxShadow,
      zIndex: props.zIndex
    }
  }

  // Supprimer les props qui ont été déplacées dans style
  delete propsElement.boxShadow;
  delete propsElement.zIndex;

  const setDropRef = useCallback((element: HTMLDivElement | null) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      (ref as MutableRefObject<HTMLDivElement | null>).current = element
    }
    if (element && drop) {
      drop(element)
    }
    // Forwarder la ref
    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(element)
      } else {
        forwardedRef.current = element
      }
    }
  }, [ref, drop, forwardedRef])

  // Styles de base pour les zones de drop
  const dropZoneStyle = {
    content: '""',
    position: 'absolute',
    left: '4px',
    right: '4px',
    height: '4px',
    background: 'linear-gradient(90deg, rgba(49,130,206,0.2) 0%, rgba(49,130,206,0.8) 50%, rgba(49,130,206,0.2) 100%)',
    boxShadow: '0 0 8px rgba(49,130,206,0.4)',
    transition: 'all 0.15s ease-in-out',
    transform: 'scaleY(0)',
    zIndex: 1000,
    pointerEvents: 'none',
    opacity: 0
  }

  // Ajouter les styles de drop zone
  if (isOver || dropZones.top.isVisible || dropZones.bottom.isVisible) {
    propsElement.position = 'relative'
    propsElement.outline = '2px solid rgba(49,130,206,0.6)'
    propsElement.outlineOffset = '2px'
    propsElement.bg = 'blue.50'
    propsElement.transform = 'scale(1.01)'
    
    if (dropZones.top.isVisible) {
      propsElement._before = {
        ...dropZoneStyle,
        top: '-6px',
        transform: 'scaleY(1)',
        opacity: (100 - dropZones.top.distance) / 100
      }
    }
    
    if (dropZones.bottom.isVisible) {
      propsElement._after = {
        ...dropZoneStyle,
        bottom: '-6px',
        transform: 'scaleY(1)',
        opacity: (100 - dropZones.bottom.distance) / 100
      }
    }
  }

  const renderChildren = () => {
    if (children) {
      return children
    }
    
    // Si le composant a des enfants, les rendre comme des ComponentPreview
    if (component.children && component.children.length > 0) {
      return component.children.map((childId, childIndex) => (
        <ComponentPreview
          key={childId}
          componentName={childId}
          index={childIndex}
        />
      ))
    }
    
    // Si pas d'enfants, retourner null
    return null
  }

  if (!isBoxWrapped) {
    propsElement.ref = setDropRef
  }

  const componentChildren = React.createElement(
    type,
    propsElement,
    renderChildren()
  )

  if (isBoxWrapped) {
    return (
      <Box 
        display="inline"
        position="relative"
        transition="all 0.15s ease-in-out"
        ref={setDropRef}
        sx={{
          '&:hover': {
            '& > *': {
              outline: '1px solid rgba(49,130,206,0.3)',
              outlineOffset: '2px'
            }
          }
        }}
      >
        {componentChildren}
      </Box>
    )
  }

  return componentChildren
})

WithChildrenPreviewContainer.displayName = 'WithChildrenPreviewContainer'

export default WithChildrenPreviewContainer
