import React from 'react'
import { FormControl } from '@chakra-ui/react'
import ColorPicker from './ColorPicker'
import FormLabel from '../FormLabel'

interface ColorInputProps {
  name: string
  value: string
  label?: string
  onChange: (value: string) => void
}

const ColorInput: React.FC<ColorInputProps> = ({
  name,
  value,
  label,
  onChange,
}) => {
  return (
    <FormControl>
      {label && <FormLabel name={name}>{label}</FormLabel>}
      <ColorPicker
        value={value || '#000000'}
        onChange={onChange}
      />
    </FormControl>
  )
}

export default ColorInput 
