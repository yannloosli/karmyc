import React from 'react'
import { Box, Icon, Text, VStack } from '@chakra-ui/react'
import { useDropComponent } from 'src/hooks/useDropComponent'
import { MdAdd } from 'react-icons/md'

const EmptyDropZone: React.FC = () => {
  const { drop, isOver } = useDropComponent('root', 0, null)

  return (
    <Box
      ref={drop}
      w="100%"
      h="200px"
      border="2px dashed"
      borderColor={isOver ? 'blue.500' : 'gray.300'}
      borderRadius="md"
      transition="all 0.2s"
      bg={isOver ? 'blue.50' : 'transparent'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      _hover={{
        borderColor: 'blue.500',
        bg: 'blue.50'
      }}
    >
      <VStack spacing={2}>
        <Icon as={MdAdd} w={8} h={8} color={isOver ? 'blue.500' : 'gray.400'} />
        <Text color={isOver ? 'blue.500' : 'gray.500'}>
          Déposez un composant ici
        </Text>
      </VStack>
    </Box>
  )
}

export default EmptyDropZone 
