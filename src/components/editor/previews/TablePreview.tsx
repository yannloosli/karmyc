import React from 'react'
import * as Chakra from '@chakra-ui/react'
import { useInteractive } from 'src/hooks/useInteractive'
import { useDropComponent } from 'src/hooks/useDropComponent'
import ComponentPreview from 'src/components/editor/ComponentPreview'
import { Table, Tr, TableContainer, Box } from '@chakra-ui/react'

const TablePreview: React.FC<IPreviewProps> = ({ component, index }) => {
  const acceptedTypes = [
    'TableCaption',
    'THead',
    'TBody',
    'TFoot',
  ] as ComponentType[]
  const { props, ref } = useInteractive(component, index)
  const { drop, isOver } = useDropComponent(component.id, index, ref, acceptedTypes)

  let boxProps: any = {}

  if (isOver) {
    props.bg = 'teal.50'
  }

  return (
    <Box ref={drop(ref)} {...boxProps} {...props}>
      <TableContainer>
        <Table {...props}>
          {component.children.map((key: string) => (
            <ComponentPreview key={key} index={index} componentName={key} />
          ))}
        </Table>
      </TableContainer>
    </Box>
  )
}

export const TrPreview: React.FC<IPreviewProps> = ({ component, index }) => {
  const acceptedTypes = ['Td', 'Th'] as ComponentType[]
  const { props, ref } = useInteractive(component, index)
  const { drop, isOver } = useDropComponent(component.id, index, ref, acceptedTypes)

  if (isOver) {
    props.bg = 'teal.50'
  }

  return (
    <Tr {...props} ref={drop(ref)}>
      {component.children.map((key: string) => (
        <ComponentPreview key={key} index={index} componentName={key} />
      ))}
    </Tr>
  )
}

export default TablePreview
