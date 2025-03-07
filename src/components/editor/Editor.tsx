import React, { memo, useCallback, useRef } from 'react'
import { Box, theme as baseTheme, ChakraProvider } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { getComponents } from '@/store/selectors/components'
import { getNewTheme } from '@/store/selectors/customComponents'
import { getShowLayout } from '@/store/selectors/app'
import ComponentPreview from 'src/components/editor/ComponentPreview'
import { omit } from 'lodash'
import { myTheme } from '../../theme/myTheme'
import Fonts from 'src/components/Fonts'
import { unselect } from '../../store/slices/componentsSlice'
import { useDropComponent } from '../../hooks/useDropComponent'
import EmptyDropZone from './EmptyDropZone'

const defaultTheme = {
    headingFontFamily: 'roboto',
    bodyFontFamily: 'roboto',
}

export const themeColors: any = Object.keys(
    omit(baseTheme.colors, ['transparent', 'current', 'black', 'white']),
)

export const gridStyles = {
    backgroundImage:
        'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
    backgroundSize: '20px 20px',
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
                {isEmpty ? (
                    <EmptyDropZone />
                ) : (
                    components?.root?.children?.map((name, i) => (
                        <ComponentPreview key={name} index={i} componentName={name} />
                    ))
                )}
            </Box>
        </ChakraProvider>
    )

    return Playground
}

export default memo(Editor)
