import React from 'react'
import SwitchControl from 'src/components/inspector/controls/SwitchControl'

const AccordionPanel = () => {
  return (
    <>
      <SwitchControl label="Allow multiple" name="allowMultiple" />
      <SwitchControl label="Allow toggle" name="allowToggle" />
    </>
  )
}

export default AccordionPanel
