import React, { FunctionComponent, ComponentClass, useCallback, MutableRefObject } from 'react'
import { useInteractive } from 'src/hooks/useInteractive'
import { Box, Icon } from '@chakra-ui/react'
import { useDropComponent } from 'src/hooks/useDropComponent'
import { MdArrowUpward, MdArrowDownward } from 'react-icons/md'

const PreviewContainer: React.FC<{
    component: IComponent
    type: string | FunctionComponent<any> | ComponentClass<any, any>
    enableVisualHelper?: boolean
    isBoxWrapped?: boolean
    index: number
}> = ({
    component,
    type,
    enableVisualHelper,
    isBoxWrapped,
    index,
    ...forwardedProps
}) => {
    const { props, ref } = useInteractive(component, index, enableVisualHelper)
    const { drop, isOver, dropZones } = useDropComponent(component.id, index, ref)

    // Filtrer les props spéciales
    const { componentName, ...filteredProps } = props

    // Styles de base pour les zones de drop
    const dropZoneBaseStyle = {
        content: '""',
        position: 'absolute',
        left: '0px',
        right: '0px',
        height: '0px',
        maxHeight: '32px',
        background: 'linear-gradient(90deg, rgba(49,130,206,0.2) 0%, rgba(49,130,206,0.8) 50%, rgba(49,130,206,0.2) 100%)',
        boxShadow: '0 0 8px rgba(49,130,206,0.4)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'scaleY(0)',
        transformOrigin: 'center',
        zIndex: 2000,
        pointerEvents: 'none',
        opacity: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)'
    }

    // Ajouter les styles de drop zone
    const elementProps = {
        ...filteredProps,
        ...forwardedProps,
        index,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isOver ? 2 : 1,
        _hover: {
            ...filteredProps._hover,
        }
    }

    if (isOver || dropZones.top.isVisible || dropZones.bottom.isVisible) {
        elementProps.outline = '2px solid rgba(49,130,206,0.8)'
        elementProps.outlineOffset = '2px'
        elementProps.bg = 'rgba(235,248,255,0.8)'
        elementProps.transform = 'scale(1.01)'
        elementProps.boxShadow = '0 0 16px rgba(49,130,206,0.2)'
        
        if (dropZones.top.isVisible) {
            const scale = (100 - dropZones.top.distance) / 100
            elementProps._before = {
                ...dropZoneBaseStyle,
                top: '-32px',
                height: `${32 * scale}px`,
                transform: 'scaleY(1)',
                opacity: scale,
                children: <Icon as={MdArrowUpward} color="white" w={6} h={6} style={{ transform: `scale(${scale})` }} />
            }
        }
        
        if (dropZones.bottom.isVisible) {
            const scale = (100 - dropZones.bottom.distance) / 100
            elementProps._after = {
                ...dropZoneBaseStyle,
                bottom: '-32px',
                height: `${32 * scale}px`,
                transform: 'scaleY(1)',
                opacity: scale,
                children: <Icon as={MdArrowDownward} color="white" w={6} h={6} style={{ transform: `scale(${scale})` }} />
            }
        }
    }

    const setDropRef = useCallback((element: HTMLDivElement | null) => {
        if (ref && typeof ref === 'object' && 'current' in ref) {
            (ref as MutableRefObject<HTMLDivElement | null>).current = element
        }
        if (element && drop) {
            drop(element)
        }
    }, [ref, drop])

    const children = React.createElement(type, elementProps)

    if (isBoxWrapped) {
        return (
            <Box 
                ref={setDropRef}
                position="relative"
                transition="all 0.2s ease-in-out"
                zIndex={isOver ? 2 : 1}
                sx={{
                    '&:hover': {
                        '& > *': {
                            outline: '1px solid rgba(49,130,206,0.3)',
                            outlineOffset: '2px'
                        }
                    }
                }}
            >
                {children}
            </Box>
        )
    }

    return React.cloneElement(children, { ref: setDropRef })
}

export default PreviewContainer
