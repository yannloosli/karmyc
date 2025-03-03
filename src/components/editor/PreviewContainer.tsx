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
        height: '24px',
        background: 'linear-gradient(90deg, rgba(49,130,206,0.4) 0%, rgba(49,130,206,1) 50%, rgba(49,130,206,0.4) 100%)',
        boxShadow: '0 0 4px rgba(49,130,206,0.6)',
        transition: 'all 0.2s ease-in-out',
        transform: 'scaleY(0)',
        zIndex: 2000,
        pointerEvents: 'none',
        opacity: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }

    // Ajouter les styles de drop zone
    const elementProps = {
        ...filteredProps,
        ...forwardedProps,
        index,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        zIndex: isOver ? 2 : 1,
        _hover: {
            ...filteredProps._hover,
        }
    }

    if (isOver || dropZones.top.isVisible || dropZones.bottom.isVisible) {
        elementProps.outline = '2px solid rgba(49,130,206,0.8)'
        elementProps.outlineOffset = '2px'
        elementProps.bg = 'blue.50'
        elementProps.transform = 'scale(1.01)'
        
        if (dropZones.top.isVisible) {
            elementProps._before = {
                ...dropZoneBaseStyle,
                top: '-24px',
                transform: 'scaleY(1)',
                opacity: (100 - dropZones.top.distance) / 100,
                children: <Icon as={MdArrowUpward} color="white" w={6} h={6} />
            }
        }
        
        if (dropZones.bottom.isVisible) {
            elementProps._after = {
                ...dropZoneBaseStyle,
                bottom: '-24px',
                transform: 'scaleY(1)',
                opacity: (100 - dropZones.bottom.distance) / 100,
                children: <Icon as={MdArrowDownward} color="white" w={6} h={6} />
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
