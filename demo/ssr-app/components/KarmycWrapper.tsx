'use client';

import * as React from 'react';
import { useKarmyc } from '../../../src/hooks/useKarmyc';
import { KarmycCoreProvider } from '../../../src/core/KarmycCoreProvider';
import { Tools } from '../../../src/components/ToolsSlot';
import { TOOLBAR_HEIGHT } from '../../../src/utils/constants';
import { AreaInitializer } from '../../shared/config/AreaInitializer';
import { Karmyc } from '../../../src/components/Karmyc';
import { ContextMenu } from '../../../src/components/menus/ContextMenu';
import { karmycConfig } from '../../shared/config/karmycConfig';

interface KarmycWrapperProps {
    isClient: boolean;
}

export const KarmycWrapper: React.FC<KarmycWrapperProps> = ({ isClient }) => {
    const config = useKarmyc(karmycConfig);

    // Si on n'est pas côté client, on affiche un placeholder
    if (!isClient) {
        return (
            <div style={{ 
                width: '100%', 
                height: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#1a1a1a',
                color: 'white',
                fontSize: '18px'
            }}>
                Chargement de Karmyc...
            </div>
        );
    }

    return (
        <KarmycCoreProvider options={config}>
            <AreaInitializer />
            <ContextMenu />
            <Tools areaType="apptitle">
                <Tools areaType="app">
                    <Karmyc offset={TOOLBAR_HEIGHT * 2} />
                </Tools>
            </Tools>
        </KarmycCoreProvider>
    );
}; 
