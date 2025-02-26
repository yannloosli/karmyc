import React, { useEffect, useRef, useState } from 'react';
import { Flex, Box } from '@chakra-ui/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Global } from '@emotion/react'
import useShortcuts from 'src/hooks/useShortcuts'
import Header from 'src/components/Header'
import Loader from 'src/components/Loader'
import Sidebar from 'src/components/sidebar/Sidebar'
import Editor from 'src/components/editor/Editor'
import { InspectorProvider } from 'src/contexts/inspector-context'
import Inspector from 'src/components/inspector/Inspector'
import { useSelector } from 'react-redux'
import { getEditorWidth } from './store/selectors/app'
import GridLayout from "react-grid-layout";
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/store'
import { ChakraProvider } from '@chakra-ui/react'

const AppContent = () => {
    const editorWidth = useSelector(getEditorWidth)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)
    const tmpH = containerRef.current?.getBoundingClientRect().height
    const tmpW = containerRef.current?.getBoundingClientRect().width
    useShortcuts()

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current?.getBoundingClientRect().width !== containerWidth)
                setContainerWidth(containerRef.current.getBoundingClientRect().width)
            if (containerRef.current?.getBoundingClientRect().height !== containerHeight)
                setContainerHeight(containerRef.current.getBoundingClientRect().height)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (containerRef.current.getBoundingClientRect().width !== containerWidth)
            setContainerWidth(containerRef.current.getBoundingClientRect().width)
        if (containerRef.current.getBoundingClientRect().height !== containerHeight)
            setContainerHeight(containerRef.current.getBoundingClientRect().height)
    }, [tmpH, tmpW])

    return (
        <>
            <Global
                styles={() => ({
                    html: { minWidth: '860px', backgroundColor: '#1a202c' },
                })}
            />
            <Loader />
            <Header />
            <DndProvider backend={HTML5Backend}>
                <Flex ref={containerRef} w='100vw' h="calc(100dvh - 7rem)">
                    {containerWidth > 0 && containerHeight > 0 && <GridLayout
                        className="layout"
                        cols={12}
                        rowHeight={200}
                        width={containerWidth}
                    >
                        <Box key="Sidebar" overflow='hidden' data-grid={{ x: 0, y: 0, w: 2, h: Math.floor(containerHeight / 200),  static: true }}>
                            <Sidebar />
                        </Box>
                        <Box key="Editor" data-grid={{ x: 2, y: 0, w: 7, h: Math.floor(containerHeight / 200), static: true  }}>
                            <Flex
                                w={editorWidth}
                                bg="#edf2f6"
                                transition="all ease 0.5s"
                                h="100%"
                                align="center"
                                justify="center"
                                alignItems="stretch"
                                m="0 auto"
                            >
                                <Editor />
                            </Flex>
                        </Box>
                        <Box key="Inspector" data-grid={{ x: 10, y: 0, w: 3, h: Math.floor(containerHeight / 200) ,  static: true}}>
                            <Box
                                flex="0 0 15rem"
                                bg="#f7fafc"
                                overflowY="auto"
                                overflowX="visible"
                                borderLeft="1px solid #cad5de"
                                className="inspector"
                            >
                                <InspectorProvider>
                                    <Inspector />
                                </InspectorProvider>
                            </Box>
                        </Box>
                    </GridLayout>}
                </Flex>
            </DndProvider>
        </>
    )
}

const App = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <ChakraProvider>
                    <AppContent />
                </ChakraProvider>
            </PersistGate>
        </Provider>
    )
}

export default App 
