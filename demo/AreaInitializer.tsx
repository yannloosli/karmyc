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
import { CircleSlash, Link } from 'lucide-react';

export const AreaInitializer: FC<{}> = ({ }) => {
    const { updateArea } = useKarmycStore.getState();

    // Utiliser le hook unifié pour chaque barre
    const { registerComponent: registerTitleComponent } = useToolsSlot('apptitle', 'top-outer');
    const { registerComponent: registerRootMenuComponent } = useToolsSlot('app', 'top-outer');
    const { registerComponent: registerRootStatusComponent } = useToolsSlot('app', 'bottom-outer');
    const { registerComponent: registerRootMenuDemoArea } = useToolsSlot('demo-area', 'top-inner');

    useMemo(() => {
        registerRootStatusComponent(
            () => <div style={{ color: 'white', padding: '8px' }}>Screen management 💪==&gt;</div>,
            { name: 'screen-status-bar', type: 'status' },
            { order: 990, alignment: 'right', width: 'auto' }
        );
        registerRootMenuComponent(
            () => <div style={{ color: 'white', padding: '8px' }}>Top outer left slot</div>,
            { name: 'topOuterLeftSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
        registerRootMenuDemoArea(
            () => <div>Top Demo Area center slot</div>,
            { name: 'topOuterSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
        registerTitleComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                    <img
                        src="/assets/brand/icon.svg"
                        style={{ width: '28px', height: '28px' }}
                    />
                    <strong>
                        Karmyc core Demo
                    </strong>
                </div>
            ),
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





    // Action handlers for area creation (utilisation de updateArea Zustand)
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



    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-demo-area', handleDemoArea);
        actionRegistry.registerActionHandler('area.create-logo-karmyc', handleLogoKarmyc);

        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-demo-area');
            actionRegistry.unregisterActionHandler('area.create-logo-karmyc');
        };
    }, [updateArea]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('demo-area');
            areaRegistry.unregisterAreaType('logo-karmyc');
        };
    }, []);


    return null;
};
