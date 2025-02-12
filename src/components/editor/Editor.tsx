import React, { memo, useState, useEffect, useRef } from 'react'
import { Box, Text, Link, theme as baseTheme, ChakraProvider } from '@chakra-ui/react'
import { useDropComponent } from 'src/hooks/useDropComponent'
import { useSelector } from 'react-redux'
import useDispatch from 'src/hooks/useDispatch'
import { getComponents } from 'src/core/selectors/components'
import { getNewTheme } from 'src/core/selectors/customComponents'
import { getShowLayout } from 'src/core/selectors/app'
import ComponentPreview from 'src/components/editor/ComponentPreview'
import { omit } from 'lodash'
import myTheme from './myTheme'
import Fonts from 'src/components/Fonts'

export const themeColors: any = Object.keys(
    omit(baseTheme.colors, ['transparent', 'current', 'black', 'white']),
)

export const gridStyles = {
    backgroundImage:
        'linear-gradient(to right, #d9e2e9 1px, transparent 1px),linear-gradient(to bottom, #d9e2e9 1px, transparent 1px);',
    backgroundSize: '20px 20px',
    bgColor: '#edf2f6',
    p: 10,
}

export const convertToPascal = (filePath: string) => {
    const fileName = filePath.split('/').slice(-1)[0]
    let fileArray = fileName.split('-')
    fileArray = fileArray.map(word => {
        return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`
    })
    return fileArray.join('')
}

const Editor: React.FC = () => {
    const showLayout = useSelector(getShowLayout)
    const components = useSelector(getComponents)
    const newThemeState = useSelector(getNewTheme)
    const dispatch = useDispatch()
    const ref = useRef(null)

    const { drop } = useDropComponent('root', 0, ref)
    const isEmpty = !components.root.children.length
    const rootProps = components.root.props

    let editorBackgroundProps = {}

    const onSelectBackground = () => {
        dispatch.components.unselect()
    }

    if (showLayout) {
        editorBackgroundProps = gridStyles
    }

    editorBackgroundProps = {
        ...editorBackgroundProps,
        ...rootProps,
    }

    const Playground = (
        <ChakraProvider theme={myTheme(newThemeState)} resetCSS={false} cssVarsRoot="#root">
            {/* <Fonts
                headingFontFamily={newThemeState.headingFontFamily}
                bodyFontFamily={newThemeState.bodyFontFamily}
            /> */}
            <Box
                className="editor"
                bg="chakra-body-bg"
                p={2}
                {...editorBackgroundProps}
                height="100%"
                sx={{
                    scrollbarColor: 'rgba(49, 151, 149, .7) transparent',
                }}
                minWidth="10rem"
                width="100%"
                display={isEmpty ? 'flex' : 'block'}
                justifyContent="center"
                alignItems="center"
                overflow="auto"
                ref={drop(ref)}
                position="relative"
                flexDirection="column"
                onClick={onSelectBackground}
            >
                {isEmpty && (
                    <Text maxWidth="md" color="gray.400" fontSize="xl" textAlign="center">
                        Drag some component to start coding without code! Or load{' '}
                        <Link
                            color="gray.500"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                dispatch.components.loadDemo('onboarding')
                            }}
                            textDecoration="underline"
                        >
                            the onboarding components
                        </Link>
                        .
                    </Text>
                )}
                {components.root.children.map((name, i) => (
                    <ComponentPreview key={name} index={i} componentName={name} />
                ))}
            </Box>
        </ChakraProvider>
    )

    return Playground



}

export default memo(Editor)
