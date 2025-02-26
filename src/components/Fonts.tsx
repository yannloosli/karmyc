import React from 'react'
import { Global } from '@emotion/react'

interface FontsProps {
  headingFontFamily: string
  bodyFontFamily: string
}

const Fonts: React.FC<FontsProps> = ({ headingFontFamily, bodyFontFamily }) => {
  return (
    <Global
      styles={`
        @import url('https://fonts.googleapis.com/css2?family=${headingFontFamily}&family=${bodyFontFamily}&display=swap');
      `}
    />
  )
}

export default Fonts
