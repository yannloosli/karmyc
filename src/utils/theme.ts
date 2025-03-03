import { theme as baseTheme } from '@chakra-ui/react'
import { omit } from 'lodash'

export const themeColors: any = Object.keys(
    omit(baseTheme.colors, ['transparent', 'current', 'black', 'white']),
)

export const convertToPascal = (filePath: string) => {
    const fileName = filePath.split('/').slice(-1)[0]
    let fileArray = fileName.split('-')
    fileArray = fileArray.map(word => {
        return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`
    })
    return fileArray.join('')
}

export const defaultTheme = {
    headingFontFamily: 'roboto',
    bodyFontFamily: 'roboto',
} 
