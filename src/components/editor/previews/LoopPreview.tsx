import React from 'react'
import { Box } from '@chakra-ui/react'
import ComponentPreview from 'src/components/editor/ComponentPreview'
import { useDropComponent } from 'src/hooks/useDropComponent'
import { useInteractive } from 'src/hooks/useInteractive'

const LoopPreview: React.FC<{ component: IComponent, index: number }> = ({ component, index }) => {
    const { props, ref } = useInteractive(component, index)
    const { drop, isOver } = useDropComponent(component.id, index, ref)
  if (isOver) {
    props.bg = 'teal.50'
  }

  const loopArray: number[] = []
  const loopLength = Number(props.loopNumber)

  const getArray = (length: number) => {
    for (let i = 1; i <= length; i++) {
      loopArray.push(i)
    }
  }

  if (loopLength && loopLength > 0) {
    getArray(loopLength)
  }

  return (
    <Box pos="relative" ref={drop(ref)} index={index} {...props}>
      {!props.loopView ? (
        <>
          {component.children.map((key: string) => (
            <ComponentPreview key={key} index={index} componentName={key} />
          ))}
        </>
      ) : loopLength && loopLength > 0 ? (
        <>
          {loopArray.map((_, loopIndex) =>
            component.children.map((key: string) => (
              <ComponentPreview 
                key={`${key}-${loopIndex}`} 
                index={index} 
                componentName={key} 
              />
            )),
          )}
        </>
      ) : (
        <>
          {[1, 2, 3, 4].map((_, loopIndex) =>
            component.children.map((key: string) => (
              <ComponentPreview 
                key={`${key}-${loopIndex}`} 
                index={index} 
                componentName={key} 
              />
            )),
          )}
        </>
      )}
    </Box>
  )
}

export default LoopPreview
