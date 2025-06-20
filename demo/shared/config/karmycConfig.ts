import { AREA_ROLE } from '../../../src/core/types/actions';

export const karmycConfig = {
    plugins: [],
    initialAreas: [
        { id: 'area-1', type: 'logo-karmyc-area', state: {}, role: AREA_ROLE.SELF },
        { id: 'area-2', type: 'demo-area', state: {}, role: AREA_ROLE.LEAD },
        { id: 'area-3', type: 'keyboard-shortcuts-area', state: {}, role: AREA_ROLE.SELF },
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
                            { id: 'area-1', size: 0.25 },
                            { id: 'area-2', size: 0.5 },
                            { id: 'area-3', size: 0.25 },
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
