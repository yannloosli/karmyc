import React, { memo } from 'react'
import { Select } from '@chakra-ui/react'
import FormControl from 'src/components/inspector/controls/FormControl'
import { useForm } from 'src/hooks/useForm'
import usePropsSelector from 'src/hooks/usePropsSelector'

const FlexPanel = () => {
  const { setValueFromEvent } = useForm()

  const alignItems = usePropsSelector('alignItems')
  const flexDirection = usePropsSelector('flexDirection')
  const justifyContent = usePropsSelector('justifyContent')

  return (
    <>
      <FormControl label="Direction" htmlFor="flexDirection">
        <Select
          name="flexDirection"
          size="sm"
          value={flexDirection}
          onChange={setValueFromEvent}
        >
          <option>row</option>
          <option>row-reverse</option>
          <option>column</option>
          <option>column-reverse</option>
        </Select>
      </FormControl>

      <FormControl label="Justify content" htmlFor="justifyContent">
        <Select
          name="justifyContent"
          size="sm"
          value={justifyContent}
          onChange={setValueFromEvent}
        >
          <option>flex-start</option>
          <option>center</option>
          <option>flex-end</option>
          <option>space-between</option>
          <option>space-around</option>
        </Select>
      </FormControl>

      <FormControl label="Align items" htmlFor="alignItems">
        <Select
          name="alignItems"
          size="sm"
          value={alignItems || ''}
          onChange={setValueFromEvent}
        >
          <option>stretch</option>
          <option>flex-start</option>
          <option>center</option>
          <option>flex-end</option>
          <option>space-between</option>
          <option>space-around</option>
        </Select>
      </FormControl>
    </>
  )
}

export default memo(FlexPanel)
