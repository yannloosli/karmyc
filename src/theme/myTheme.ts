import { extendTheme } from '@chakra-ui/react'
import { store } from '../store/store'

const defaultTheme = {
  brand: 'cyan',
  primaryColor: 'blue.400',
  textColor: 'gray.900',
  bgColor: 'blackAlpha.100',
  paperColor: 'whiteAlpha.900',
  borderColor: 'gray.200',
  headingFontFamily: 'roboto',
  bodyFontFamily: 'roboto',
}

export const myTheme = () => {
  const state = store.getState()
  const customTheme = state.customComponents.present.newTheme || defaultTheme

  return extendTheme({
    colors: {
      brand: customTheme.brand,
      primaryColor: customTheme.primaryColor,
      textColor: customTheme.textColor,
      bgColor: customTheme.bgColor,
      paperColor: customTheme.paperColor,
      borderColor: customTheme.borderColor,
    },
    fonts: {
      heading: customTheme.headingFontFamily,
      body: customTheme.bodyFontFamily,
    },
  })
} 
