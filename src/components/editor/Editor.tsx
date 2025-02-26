import React, { memo, useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, Link, theme as baseTheme, ChakraProvider } from '@chakra-ui/react'
import { useDropComponent } from 'src/hooks/useDropComponent'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { getComponents } from '@/store/selectors/components'
import { getNewTheme } from '@/store/selectors/customComponents'
import { getShowLayout } from '@/store/selectors/app'
import ComponentPreview from 'src/components/editor/ComponentPreview'
import { omit } from 'lodash'
import { myTheme } from '../../theme/myTheme'
import Fonts from 'src/components/Fonts'
import { loadDemo, unselect } from '../../store/slices/componentsSlice'

const defaultTheme = {
    headingFontFamily: 'roboto',
    bodyFontFamily: 'roboto',
}

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
    const dispatch = useAppDispatch()
    
    const ref = useRef(null)

    const { drop } = useDropComponent('root', 0, ref)
    const isEmpty = !components?.root?.children?.length
    const rootProps = components?.root?.props || {}

    let editorBackgroundProps = {}

    const onSelectBackground = () => {
        dispatch(unselect())
    }

    if (showLayout) {
        editorBackgroundProps = gridStyles
    }

    editorBackgroundProps = {
        ...editorBackgroundProps,
        ...rootProps,
    }

    const dropRef = useCallback(
        (node: HTMLDivElement) => {
            ref.current = node
            drop(node)
        },
        [drop]
    )

    const handleLoadDemo = useCallback((demoName: string) => {
        dispatch(loadDemo(demoName))
    }, [dispatch])

    const Playground = (
        <ChakraProvider theme={myTheme()}>
            {newThemeState && (
                <Fonts
                    headingFontFamily={newThemeState.headingFontFamily}
                    bodyFontFamily={newThemeState.bodyFontFamily}
                />
            )}
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
                ref={dropRef}
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
                                handleLoadDemo('onboarding')
                            }}
                            textDecoration="underline"
                        >
                            the onboarding components
                        </Link>
                        .
                    </Text>
                )}
                {components?.root?.children?.map((name, i) => (
                    <ComponentPreview key={name} index={i} componentName={name} />
                ))}
            </Box>
        </ChakraProvider>
    )

    return Playground
}

export default memo(Editor)
