import React, { memo } from 'react'
import { Select, Input } from '@chakra-ui/react'
import FormControl from 'src/components/inspector/controls/FormControl'
import { useForm } from 'src/hooks/useForm'
import usePropsSelector from 'src/hooks/usePropsSelector'
import SwitchControl from 'src/components/inspector/controls/SwitchControl'
import TextControl from 'src/components/inspector/controls/TextControl'

const TooltipPanel = () => {
  const { setValueFromEvent } = useForm()
  const placement = usePropsSelector('placement')

  return (
    <>
      <SwitchControl label="Has Arrow" name="hasArrow" />

      <FormControl htmlFor="placement" label="Placement">
        <Select
          id="placement"
          onChange={setValueFromEvent}
          name="placement"
          size="sm"
          value={placement || ''}
        >
          <option>auto</option>
          <option>top</option>
          <option>right</option>
          <option>bottom</option>
          <option>left</option>
          <option>auto-start</option>
          <option>top-start</option>
          <option>right-start</option>
          <option>bottom-start</option>
          <option>left-start</option>
          <option>auto-end</option>
          <option>top-end</option>
          <option>right-end</option>
          <option>bottom-end</option>
          <option>left-end</option>
        </Select>
      </FormControl>
      <TextControl name="label" label="Label" />
      <TextControl name="aria-label" label="Aria Label" />
    </>
  )
}

export default memo(TooltipPanel)
