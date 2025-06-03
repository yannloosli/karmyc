import * as React from 'react';
import { Karmyc, KarmycProvider, useKarmyc, Tools, AREA_ROLE, TOOLBAR_HEIGHT } from '../src';
import '../style.css';
import { AreaInitializer } from './AreaInitializer';

const App: React.FC = () => {
    const karmycConfig = {
        enableLogging: true,
        plugins: [],
        initialAreas: [
            { id: 'area-1', type: 'demo-area', state: {}, role: AREA_ROLE.LEAD },
            { id: 'area-2', type: 'logo-karmyc', state: {}, role: AREA_ROLE.SELF },
            { id: 'area-3', type: 'demo-area', state: {}, role: AREA_ROLE.LEAD },
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
                <Tools  areaType="apptitle">
                    <Tools>
                        <Karmyc offset={TOOLBAR_HEIGHT  * 2}/>
                    </Tools>
                </Tools>
            </KarmycProvider>
        </div>
    );
};

export default App; 
