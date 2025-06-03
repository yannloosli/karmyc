import { useEffect, useMemo, FC } from 'react';

import {
    actionRegistry,
    areaRegistry,
    useRegisterAreaType,
    useKarmycStore,
    useToolsSlot,
    EmptyAreaMessage,
    AREA_ROLE
} from '..';
import { useAreaKeyboardShortcuts } from '../src/core/plugins/keyboard/hooks/useAreaKeyboardShortcuts';
import { CircleSlash, Link, Keyboard } from 'lucide-react';
import KeyboardShortcutsViewer from '../src/core/ui/KeyboardShortcutsViewer';
import { SpaceMenu } from '../src/core/ui/SpaceMenu';
import { useSpace } from '../src/spaces/useSpace';

export const AreaInitializer: FC<{}> = ({ }) => {
    const { updateArea } = useKarmycStore.getState();

    // Utiliser le hook unifié pour chaque barre
    const { registerComponent: registerTitleComponent } = useToolsSlot('apptitle', 'top-outer');
    const { registerComponent: registerRootMenuComponent } = useToolsSlot('app', 'top-outer');
    const { registerComponent: registerRootStatusComponent } = useToolsSlot('app', 'bottom-outer');
    const { registerComponent: registerRootMenuDemoArea } = useToolsSlot('demo-area', 'top-inner');

    // Définir les raccourcis clavier pour demo-area
    useAreaKeyboardShortcuts('demo-area', [
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Save Demo Area',
            fn: (areaId: string) => {
                console.log(`Saving demo area ${areaId}`);
                // Implémentation de la sauvegarde
            },
            history: true,
            isGlobal: true
        },
        {
            key: 'R',
            name: 'Reset Demo Area',
            fn: (areaId: string) => {
                console.log(`Resetting demo area ${areaId}`);
                updateArea({
                    id: areaId,
                    type: 'demo-area',
                    state: areaRegistry.getInitialState('demo-area')
                });
            }
        }
    ]);

    // Définir les raccourcis clavier pour logo-karmyc
    useAreaKeyboardShortcuts('logo-karmyc', [
        {
            key: 'L',
            modifierKeys: ['Control'],
            name: 'Toggle Logo Size',
            fn: (areaId: string) => {
                console.log(`Toggling logo size for area ${areaId}`);
                // Implémentation du changement de taille
            }
        },
        {
            key: 'H',
            name: 'Hide/Show Logo',
            fn: (areaId: string) => {
                console.log(`Toggling logo visibility for area ${areaId}`);
                // Implémentation de la visibilité
            }
        }
    ]);

    useMemo(() => {
        registerRootStatusComponent(
            () => <div style={{ color: 'white', padding: '8px' }}>Screen management 💪==&gt;</div>,
            { name: 'screen-status-bar', type: 'status' },
            { order: 990, alignment: 'right', width: 'auto' }
        );
        registerRootMenuComponent(
            () => <SpaceMenu />,
            { name: 'topOuterLeftSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'left' }
        );
        registerRootMenuDemoArea(
            () => <div>Top Demo Area center slot</div>,
            { name: 'topOuterSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
        registerTitleComponent(
            () => {
                const activeScreenId = useKarmycStore(state => state.activeScreenId);
                const { activeSpaceId, getSpaceById } = useSpace();
                const activeSpace = activeSpaceId ? getSpaceById(activeSpaceId) : null;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                        <img
                            src="/assets/brand/icon.svg"
                            style={{ width: '28px', height: '28px' }}
                        />
                        <strong>
                            Karmyc core Demo
                        </strong>
                        {activeSpace && (
                            <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                                {activeSpace.name}
                            </span>
                        )}
                    </div>
                );
            },
            { name: 'topOuterLeftSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'left' }
        );
        registerTitleComponent(
            () => (
                <a
                    href="https://github.com/yannloosli/karmyc"
                    target="_blank"
                    style={{ display: 'flex', alignItems: 'center', }}
                >
                    <svg
                        viewBox='0 0 24 24'
                        style={{ width: '28px', height: '28px', fill: 'white' }}
                    >
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                </a>
            ),
            { name: 'github_link', type: 'link' },
            { order: 990, width: 'auto', alignment: 'right' }
        );


    }, [registerRootStatusComponent, registerRootMenuComponent, registerRootMenuDemoArea, registerTitleComponent]);

    // Register all area types
    useRegisterAreaType(
        'demo-area',
        EmptyAreaMessage,
        {},
        {
            displayName: 'Demo area',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.LEAD,
            icon: CircleSlash
        }
    );

    useRegisterAreaType(
        'logo-karmyc',
        () => <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', height: '100%' }}>
            <img
                src="/assets/brand/karmyc_logo.svg"
                style={{ width: '75%' }}
            />
            <strong>
                Karmyc core Demo
            </strong>
        </div>,
        {},
        {
            displayName: 'Logo Karmyc',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.SELF,
            icon: Link
        }
    );

    useRegisterAreaType(
        'keyboard-shortcuts',
        KeyboardShortcutsViewer,
        {},
        {
            displayName: 'Raccourcis Clavier',
            defaultSize: { width: 400, height: 600 },
            role: AREA_ROLE.SELF,
            icon: Keyboard
        }
    );

    // Action handlers for area creation
    const handleDemoArea = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'demo-area',
                state: areaRegistry.getInitialState('demo-area')
            });
        }
    };

    const handleLogoKarmyc = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'logo-karmyc',
                state: areaRegistry.getInitialState('logo-karmyc')
            });
        }
    };

    const handleKeyboardShortcuts = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'keyboard-shortcuts',
                state: areaRegistry.getInitialState('keyboard-shortcuts')
            });
        }
    };

    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-demo-area', handleDemoArea);
        actionRegistry.registerActionHandler('area.create-logo-karmyc', handleLogoKarmyc);
        actionRegistry.registerActionHandler('area.create-keyboard-shortcuts', handleKeyboardShortcuts);

        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-demo-area');
            actionRegistry.unregisterActionHandler('area.create-logo-karmyc');
            actionRegistry.unregisterActionHandler('area.create-keyboard-shortcuts');
        };
    }, [updateArea]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('demo-area');
            areaRegistry.unregisterAreaType('logo-karmyc');
            areaRegistry.unregisterAreaType('keyboard-shortcuts');
        };
    }, []);


    return null;
};
