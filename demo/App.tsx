import * as React from 'react';
import { useKarmyc } from '../src/hooks/useKarmyc';
import { KarmycCoreProvider } from '../src/core/KarmycCoreProvider';
import { Tools } from '../src/components/ToolsSlot';

import '../style.css';
import { AreaInitializer } from './shared/config/AreaInitializer';
import { Karmyc } from '../src/components/Karmyc';
import { ContextMenu } from '../src/components/menus/ContextMenu';
import { karmycConfig } from './shared/config/karmycConfig';

const App: React.FC = () => {
    const config = useKarmyc(karmycConfig);

    return (
        <KarmycCoreProvider options={config}>
            <AreaInitializer />
            <ContextMenu />
            <Tools areaType="apptitle">
                <Tools areaType="app">
                    <Karmyc />
                </Tools>
            </Tools>
        </KarmycCoreProvider>
    );
};

export default App; 
