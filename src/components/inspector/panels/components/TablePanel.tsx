import React, { memo } from 'react'
import { Select } from '@chakra-ui/react'
import FormControl from 'src/components/inspector/controls/FormControl'
import ColorsControl from 'src/components/inspector/controls/ColorsControl'
import { useForm } from 'src/hooks/useForm'
import usePropsSelector from 'src/hooks/usePropsSelector'

const TablePanel = () => {
  const { setValueFromEvent } = useForm()
  const variant = usePropsSelector('variant')
  const size = usePropsSelector('size')

  return (
    <>
      <FormControl label="Size" htmlFor="size">
        <Select
          name="size"
          id="size"
          size="sm"
          value={size || 'md'}
          onChange={setValueFromEvent}
        >
          <option>sm</option>
          <option>md</option>
          <option>lg</option>
        </Select>
      </FormControl>
      <ColorsControl label="Color Scheme" name="colorScheme" />

      <FormControl label="Variant" htmlFor="variant">
        <Select
          name="variant"
          id="variant"
          size="sm"
          value={variant || 'simple'}
          onChange={setValueFromEvent}
        >
          <option>simple</option>
          <option>striped</option>
          <option>unstyled</option>
        </Select>
      </FormControl>
    </>
  )
}

export default memo(TablePanel)
