import React, { memo } from 'react'
import ChildrenControl from 'src/components/inspector/controls/ChildrenControl'
import SwitchControl from 'src/components/inspector/controls/SwitchControl'

const TdThPanel = () => {
  return (
    <>
      <ChildrenControl />
      <SwitchControl label="Is numeric" name="isNumeric" />
    </>
  )
}

export default memo(TdThPanel)
