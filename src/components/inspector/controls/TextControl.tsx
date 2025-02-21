import React, { ReactNode } from 'react'
import { Input } from '@chakra-ui/react'
import FormControl from './FormControl'
import { useForm } from 'src/hooks/useForm'
import usePropsSelector from 'src/hooks/usePropsSelector'

type TextControlPropsType = {
  name: string
  label: string | ReactNode
  autoFocus?: boolean
  hasColumn?: boolean
  placeholder?: string
}

const TextControl: React.FC<TextControlPropsType> = ({
  name,
  label,
  autoFocus = false,
  hasColumn = false,
  placeholder = '',
}) => {
  const { setValueFromEvent } = useForm()
  const value = usePropsSelector(name)

  return (
    <FormControl hasColumn={hasColumn} htmlFor={name} label={label}>
      <Input
        borderRadius="md"
        autoComplete="off"
        id={name}
        name={name}
        autoFocus={autoFocus}
        size="sm"
        value={value || ''}
        type="text"
        width={hasColumn ? '3rem' : '100%'}
        placeholder={placeholder}
        onChange={setValueFromEvent}
        _placeholder={{
          color: 'gray',
        }}
      />
    </FormControl>
  )
}

export default TextControl
