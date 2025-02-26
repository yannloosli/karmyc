import React, { useState, useEffect, useCallback } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Box,
  Input,
  SimpleGrid,
  useToken,
} from '@chakra-ui/react'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

const defaultColors = [
  'gray.500',
  'red.500',
  'orange.500',
  'yellow.500',
  'green.500',
  'teal.500',
  'blue.500',
  'cyan.500',
  'purple.500',
  'pink.500',
  'linkedin.500',
  'facebook.500',
  'messenger.500',
  'whatsapp.500',
  'twitter.500',
  'telegram.500',
]

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [color, setColor] = useState(value || '#000000')
  const colors = useToken('colors', defaultColors)

  useEffect(() => {
    if (value !== color) {
      setColor(value || '#000000')
    }
  }, [value])

  const handleChange = useCallback((newColor: string) => {
    setColor(newColor)
    onChange(newColor)
  }, [onChange])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    if (newColor.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      handleChange(newColor)
    }
  }, [handleChange])

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={2}
          display="flex"
          alignItems="center"
          cursor="pointer"
        >
          <Box
            backgroundColor={color}
            w="20px"
            h="20px"
            borderRadius="md"
            mr={2}
          />
          <Input
            value={color}
            size="sm"
            width="100px"
            onChange={handleInputChange}
          />
        </Box>
      </PopoverTrigger>
      <PopoverContent width="200px" p={2}>
        <SimpleGrid columns={4} spacing={2}>
          {colors.map((colorValue, index) => (
            <Box
              key={index}
              w="100%"
              h="35px"
              backgroundColor={colorValue}
              borderRadius="md"
              cursor="pointer"
              onClick={() => handleChange(colorValue)}
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            />
          ))}
        </SimpleGrid>
      </PopoverContent>
    </Popover>
  )
}

export default React.memo(ColorPicker) 
