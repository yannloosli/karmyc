import React from 'react'
import { useDropComponent } from 'src/hooks/useDropComponent'
import { useInteractive } from 'src/hooks/useInteractive'
import ComponentPreview from 'src/components/editor/ComponentPreview'
import { Modal, ModalHeader, ModalBody, ModalFooter, Box } from '@chakra-ui/react'

interface Props {
    component: IComponent,
    index: number
}

const ModalPreview = ({ component, index }: Props) => {
    const { props, ref } = useInteractive(component, index)
    const { drop, isOver } = useDropComponent(component.id, index, ref)

    const { showpreview, size, isOpen, ...restProps } = props

    if (isOver) {
        restProps.bg = 'teal.50'
    }

    return showpreview ? (
        <Box display="flex" justifyContent="center">
            <Modal ref={drop(ref)} minW={size} {...restProps} maxW={size}>
                {component.children.map((key: string) => (
                    <ComponentPreview key={key} index={index} componentName={key} />
                ))}
            </Modal>
        </Box>
    ) : (
        <></>
    )
}

export const ModalCloseButtonPreview = ({ component, index }: Props) => {
    const {
        props: { icon, ...props },
        ref,
    } = useInteractive(component, index)
    const { isOver } = useDropComponent(component.id, index, ref)

    if (isOver) {
        props.bg = 'teal.50'
    }

    return <></>
}

export const ModalHeaderPreview = ({ component, index }: Props) => {
    const { props, ref } = useInteractive(component, index)
    const { isOver } = useDropComponent(component.id, index, ref)

    if (isOver) {
        props.bg = 'teal.50'
    }

    return <ModalHeader fontWeight="semibold" fontSize="xl" ref={ref} {...props} />
}

export const ModalContentPreview = ({ component, index }: Props) => {
    const { props, ref } = useInteractive(component, index)
    const { isOver } = useDropComponent(component.id, index, ref)

    if (isOver) {
        props.bg = 'teal.50'
    }

    return (
        <>
            {component.children.map((key: string) => (
                <ComponentPreview key={key} index={index} componentName={key} />
            ))}
        </>
    )
}

export const ModalFooterPreview = ({ component, index }: Props) => {
    const { props, ref } = useInteractive(component, index)
    const { drop, isOver } = useDropComponent(component.id, index, ref)

    if (isOver) {
        props.bg = 'teal.50'
    }

    return (
        <ModalFooter
            display="flex"
            justifyContent="flex-end"
            ref={drop(ref)}
            {...props}
        >
            {component.children.map((key: string) => (
                <ComponentPreview key={key} index={index} componentName={key} />
            ))}
        </ModalFooter>
    )
}

export const ModalBodyPreview = ({ component, index }: Props) => {
    const { props, ref } = useInteractive(component, index)
    const { drop, isOver } = useDropComponent(component.id, index, ref)

    if (isOver) {
        props.bg = 'teal.50'
    }

    return (
        <ModalBody ref={drop(ref)} {...props}>
            {component.children.map((key: string) => (
                <ComponentPreview key={key} index={index} componentName={key} />
            ))}
        </ModalBody>
    )
}

export const ModalOverlayPreview = ({ component, index }: Props) => {
    const { props, ref } = useInteractive(component, index)
    const { drop, isOver } = useDropComponent(component.id, index, ref)

    if (isOver) {
        props.bg = 'teal.50'
    }

    return <></>
}

export default ModalPreview
