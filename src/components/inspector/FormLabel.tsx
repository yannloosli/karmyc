import React from 'react'
import { FormLabel as ChakraFormLabel } from '@chakra-ui/react'

const FormLabel = ({ children, name }: { children: React.ReactNode; name: string }) => (
  <ChakraFormLabel htmlFor={name} fontSize="sm" mb={1}>
    {children}
  </ChakraFormLabel>
)

export default FormLabel
