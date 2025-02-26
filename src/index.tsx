import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'


import App from './App'
import theme from '@chakra-ui/theme'

import '@reach/combobox/styles.css'
import '/node_modules/react-grid-layout/css/styles.css'
import '/node_modules/react-resizable/css/styles.css'

const Root = () => (
    <ChakraProvider resetCSS theme={theme} cssVarsRoot={undefined}>
        <React.Suspense fallback={<div>Loading... </div>}>
            <App />
        </React.Suspense>
    </ChakraProvider>
)

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<Root />);
}
