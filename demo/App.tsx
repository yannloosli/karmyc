import * as React from 'react';
import { AREA_ROLE } from '../src/core/types/actions';
import { useKarmyc } from '../src/hooks/useKarmyc';
import { KarmycCoreProvider } from '../src/core/KarmycCoreProvider';
import { Tools } from '../src/components/ToolsSlot';
import { TOOLBAR_HEIGHT } from '../src/utils/constants';

import '../style.css';
import { AreaInitializer } from './config/AreaInitializer';
import { Karmyc } from '../src/components/Karmyc';
import { SwitchAreaTypeContextMenu } from '../src/components/menus/SwitchAreaTypeContextMenu';
import { ContextMenu } from '../src/components/menus/ContextMenu';

const App: React.FC = () => {
    const karmycConfig = {
        plugins: [],
        initialAreas: [
            { id: 'area-1', type: 'demo-area', state: {}, role: AREA_ROLE.LEAD },
            { id: 'area-2', type: 'logo-karmyc-area', state: {}, role: AREA_ROLE.SELF },
            { id: 'area-3', type: 'keyboard-shortcuts-area', state: {}, role: AREA_ROLE.SELF },
            { id: 'area-4', type: 'docs-area', state: {}, role: AREA_ROLE.SELF },
        ],
        keyboardShortcutsEnabled: true,
        builtInLayouts: [
            {
                id: 'default',
                name: 'Default layout',
                config: {
                    _id: 10,
                    rootId: 'root',
                    errors: [],
                    activeAreaId: 'area-1',
                    joinPreview: null,
                    layout: {
                        root: {
                            id: 'root',
                            type: 'area_row',
                            orientation: 'horizontal',
                            areas: [
                                { id: 'area-1', size: 0.3 },
                                { id: 'area-2', size: 0.3 },
                                { id: 'area-3', size: 0.2 },
                                { id: 'area-4', size: 0.2 }
                            ]
                        },
                        'area-1': {
                            type: 'area',
                            id: 'area-1'
                        },
                        'area-2': {
                            type: 'area',
                            id: 'area-2'
                        },
                        'area-3': {
                            type: 'area',
                            id: 'area-3'
                        },
                        'area-4': {
                            type: 'area',
                            id: 'area-4'
                        }
                    },
                    areas: {
                        'area-1': { id: 'area-1', type: 'demo-area', state: {}, role: AREA_ROLE.LEAD },
                        'area-2': { id: 'area-2', type: 'logo-karmyc-area', state: {}, role: AREA_ROLE.SELF },
                        'area-3': { id: 'area-3', type: 'keyboard-shortcuts-area', state: {}, role: AREA_ROLE.SELF },
                        'area-4': { id: 'area-4', type: 'docs-area', state: {}, role: AREA_ROLE.SELF }
                    },
                    viewports: {},
                    areaToOpen: null,
                    lastSplitResultData: null,
                    lastLeadAreaId: 'area-1'
                },
                isBuiltIn: true
            },
            {
                id: 'minimal',
                name: 'Layout minimal',
                config: {
                    _id: 10,
                    rootId: 'root',
                    errors: [],
                    activeAreaId: 'area-1',
                    joinPreview: null,
                    layout: {
                        root: {
                            id: 'root',
                            type: 'area_row',
                            orientation: 'vertical',
                            areas: [
                                { id: 'area-1', size: 0.7 },
                                { id: 'area-2', size: 0.3 }
                            ]
                        },
                        'area-1': {
                            type: 'area',
                            id: 'area-1'
                        },
                        'area-2': {
                            type: 'area',
                            id: 'area-2'
                        }
                    },
                    areas: {
                        'area-1': { id: 'area-1', type: 'demo-area', state: {}, role: AREA_ROLE.LEAD },
                        'area-2': { id: 'area-2', type: 'logo-karmyc-area', state: {}, role: AREA_ROLE.SELF }
                    },
                    viewports: {},
                    areaToOpen: null,
                    lastSplitResultData: null,
                    lastLeadAreaId: 'area-1'
                },
                isBuiltIn: true
            }
        ],
        initialLayout: 'default',
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
    };

    const config = useKarmyc(karmycConfig);

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

export default App; 
