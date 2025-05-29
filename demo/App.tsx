import React from 'react';
import { Karmyc, KarmycProvider, useKarmyc } from '../src';
import '../style.css';
import { AreaInitializer } from './AreaInitializer';

const App: React.FC = () => {

    const karmycConfig = {
        enableLogging: true,
        plugins: [],
        initialAreas: [
            { id: 'area-1', type: 'demo-area-1', state: {} },
            { id: 'area-2', type: 'demo-area-2', state: {} },
            { id: 'area-3', type: 'demo-area-1', state: {} },
        ],
        keyboardShortcutsEnabled: false,
        initialLayout: {
            type: 'area_row',
            id: 'root',
            orientation: 'horizontal',
            areas: [
                { id: 'area-1', size: 0.3 },
                { id: 'area-2', size: 0.4 },
                { id: 'area-3', size: 0.3 }
            ]
        },
    };

    const config = useKarmyc(karmycConfig);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <KarmycProvider options={config}>
                <AreaInitializer />
                <Karmyc />
            </KarmycProvider>
        </div>
    );
};

export default App; 
