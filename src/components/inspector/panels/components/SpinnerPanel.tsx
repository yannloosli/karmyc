import React, { memo } from 'react'
import { Select } from '@chakra-ui/react'
import ColorsControl from 'src/components/inspector/controls/ColorsControl'
import { useForm } from 'src/hooks/useForm'
import FormControl from 'src/components/inspector/controls/FormControl'
import usePropsSelector from 'src/hooks/usePropsSelector'
import TextControl from 'src/components/inspector/controls/TextControl'

const SpinnerPanel = () => {
  const { setValueFromEvent } = useForm()

  const size = usePropsSelector('size')

  return (
    <>
      <TextControl label="Label" name="label" />

      <ColorsControl label="Color" name="color" enableHues />

      <ColorsControl label="Empty color" name="emptyColor" enableHues />

      <FormControl label="Size" htmlFor="size">
        <Select
          name="size"
          id="size"
          size="sm"
          value={size || ''}
          onChange={setValueFromEvent}
        >
          <option>xs</option>
          <option>sm</option>
          <option>md</option>
          <option>lg</option>
          <option>xl</option>
        </Select>
      </FormControl>

      <TextControl label="Thickness" name="thickness" />
      <TextControl label="Speed" name="speed" placeholder="0.45s" />
    </>
  )
}

export default memo(SpinnerPanel)
