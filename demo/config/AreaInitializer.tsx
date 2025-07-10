import { useEffect } from 'react';
import { SpaceMenu } from '../../src/components/menus/SpaceMenu';
import { LayoutMenu } from '../../src/components/menus/LayoutMenu';
import { useSpace } from '../../src/hooks/useSpace';
import { DemoArea } from './areas/demo-area';
import { KarmycLogoArea } from './areas/karmyc-logo-area';
import { KeyboardShortcutsArea } from './areas/keyboard-shortcuts-area';
import { useToolsSlot } from '../../src/components/ToolsSlot';
import { HistoryArea } from './areas/history-area';
import { DrawArea } from './areas/draw-area';
import { SpaceManagerArea } from './areas/space-manager-area';
import { ColorPickerArea } from './areas/color-picker-area';
import { DebugArea } from './areas/debug-area';
import iconSvg from '../assets/brand/icon.svg';

export const AreaInitializer = () => {
    const { registerComponent: registerTitleComponent } = useToolsSlot('apptitle', 'top-outer');
    const { registerComponent: registerRootMenuComponent } = useToolsSlot('app', 'top-outer');
    const { registerComponent: registerRootStatusComponent } = useToolsSlot('app', 'bottom-outer');

    useEffect(() => {
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
        registerRootMenuComponent(
            () => <LayoutMenu />,
            { name: 'topOuterLayoutSlot', type: 'menu' },
            { order: 991, width: 'auto', alignment: 'left' }
        );
        registerTitleComponent(
            () => {
                const { activeSpaceId, getSpaceById } = useSpace();
                const activeSpace = activeSpaceId ? getSpaceById(activeSpaceId) : null;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                        <img
                            src={iconSvg}
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
    }, [registerRootStatusComponent, registerRootMenuComponent, registerTitleComponent]);


    return (
        <>
            <DemoArea />
            <KarmycLogoArea />
            <KeyboardShortcutsArea />
            <ColorPickerArea />
            <DebugArea />
            <HistoryArea />
            <DrawArea />
            <SpaceManagerArea />
        </>
    );
};
