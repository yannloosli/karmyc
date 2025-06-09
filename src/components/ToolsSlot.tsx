import React, { useCallback, useEffect } from 'react';
import { ScreenSwitcher } from './ScreenSwitcher';
import { useKarmycStore } from '../store/areaStore';
import { TOOLBAR_HEIGHT } from '../utils/constants';
import { Rect } from '../types/math';
import { useSpaceStore } from '../store/spaceStore';
import { useTranslation } from '../hooks/useTranslation';

// Type to uniquely identify a component
export type ComponentIdentifier = {
    name: string;
    type: string;
};

// Alignment possible in the toolbar
export type ToolsBarAlignment = 'left' | 'center' | 'right';

// Positioning of the toolbar
export type ToolsBarPosition =
    | 'top-outer'
    | 'top-inner'
    | 'bottom-outer'
    | 'bottom-inner'
    | string;

// Structure of a registered component
interface ToolsBarComponent {
    component: React.ComponentType<any>;
    order: number;
    alignment: ToolsBarAlignment;
    width?: string | number;
    identifier: ComponentIdentifier;
    allowedLayerTypes?: string[];
    callback?: (() => void)[];
}

// Global registry
const toolsBarRegistry: Record<string, ToolsBarComponent[]> = {};

// Subscription system for registry reactivity
const listeners = new Set<() => void>();
function notifyToolsRegistryChange() {
    listeners.forEach((cb) => cb());
}

// Hook for registration
/**
 * Hook for dynamically registering components in a Tools bar.
 * @param key ID of the area or type of area
 * @param position Position of the bar
 */
export function useToolsSlot(
    key: string,
    position: ToolsBarPosition,
) {
    // Use the key (ID or type) and position as registry key
    const registryKey = `${key}:${position}`;

    // Register a component in the bar
    const registerComponent = useCallback(
        (
            component: React.ComponentType<any>,
            identifier: ComponentIdentifier,
            options: {
                order?: number;
                alignment?: ToolsBarAlignment;
                width?: string | number;
                allowedLayerTypes?: string[];
                callback?: (() => void)[];
            } = {}
        ) => {
            const { order = 0, alignment = 'left', width, allowedLayerTypes, callback } = options;
            if (!toolsBarRegistry[registryKey]) {
                toolsBarRegistry[registryKey] = [];
            } else {
                toolsBarRegistry[registryKey] = toolsBarRegistry[registryKey].filter(
                    item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
                );
            }
            const id = Math.random().toString(36).substr(2, 9);
            toolsBarRegistry[registryKey].push({
                component,
                order,
                alignment,
                width,
                identifier,
                allowedLayerTypes,
                callback
            });
            toolsBarRegistry[registryKey].sort((a, b) => a.order - b.order);
            notifyToolsRegistryChange();
            return id;
        },
        [registryKey]
    );

    // Get registered components
    const getComponents = useCallback(() => {
        return toolsBarRegistry[registryKey] || [];
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
}

// Hook for subscribing to registry changes (useSyncExternalStore)
function useToolsRegistrySubscription() {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    useEffect(() => {
        listeners.add(forceUpdate);
        return () => {
            listeners.delete(forceUpdate);
        };
    }, []);
}

// Props of the Tools component
interface ToolsProps {
    areaId?: string;
    areaType?: string;
    areaState?: any;
    children: React.ReactNode;
    style?: React.CSSProperties;
    viewport?: Rect;
}

export const Tools: React.FC<ToolsProps> = ({
    areaId,
    areaType = 'app',
    areaState = {},
    children,
    viewport = {
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    }
}) => {
    const { t } = useTranslation();
    useToolsRegistrySubscription();

    const combineAndDedupe = (...componentArrays: ToolsBarComponent[][]) => {
        const componentMap = new Map<string, ToolsBarComponent>();
        componentArrays.flat().forEach(comp => {
            const key = `${comp.identifier.name}:${comp.identifier.type}`;
            if (!componentMap.has(key)) {
                componentMap.set(key, comp);
            }
        });
        return Array.from(componentMap.values()).sort((a, b) => a.order - b.order);
    };

    const { getComponents: getMenuComponentsById } = useToolsSlot(areaId || '', 'top-outer');
    const { getComponents: getMenuComponentsByType } = useToolsSlot(areaType, 'top-outer');
    const menuComponents = combineAndDedupe(getMenuComponentsById(), getMenuComponentsByType());

    const { getComponents: getStatusComponentsById } = useToolsSlot(areaId || '', 'bottom-outer');
    const { getComponents: getStatusComponentsByType } = useToolsSlot(areaType, 'bottom-outer');
    const statusComponents = combineAndDedupe(getStatusComponentsById(), getStatusComponentsByType());

    const { getComponents: getToolbarTopInnerById } = useToolsSlot(areaId || '', 'top-inner');
    const { getComponents: getToolbarTopInnerByType } = useToolsSlot(areaType, 'top-inner');
    const toolbarTopInnerComponents = combineAndDedupe(getToolbarTopInnerById(), getToolbarTopInnerByType());

    const { getComponents: getToolbarBottomInnerById } = useToolsSlot(areaId || '', 'bottom-inner');
    const { getComponents: getToolbarBottomInnerByType } = useToolsSlot(areaType, 'bottom-inner');
    const toolbarBottomInnerComponents = combineAndDedupe(getToolbarBottomInnerById(), getToolbarBottomInnerByType());

    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const multiScreen = useKarmycStore((state) => state.options.multiScreen) || false;

    // Get the area ID and its associated space
    const currentArea = useKarmycStore(state => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return undefined;
        // Activation of space by focus only applies to areas with an ID
        return areaId ? Object.values(activeScreenAreas.areas).find(area => area.id === areaId) : undefined;
    });
    const currentSpaceId = currentArea?.spaceId;

    // Focus manager to activate space
    const handleFocus = useCallback(() => {
        if (currentSpaceId) {
            useSpaceStore.getState().setActiveSpace(currentSpaceId);
        }
    }, [currentSpaceId]);

    // Calculate toolbar heights
    const hasTopOuter = menuComponents.length > 0;
    const hasBottomOuter = statusComponents.length > 0;
    console.log('====>', areaType, statusComponents);

    const topOuterHeight = hasTopOuter ? TOOLBAR_HEIGHT : 0;
    const bottomOuterHeight = hasBottomOuter ? TOOLBAR_HEIGHT : 0;

    const isFullscreen = currentArea?.enableFullscreen ?? false;

    // Organize by alignment and filter for each position
    const renderToolbar = (components: ToolsBarComponent[], position: ToolsBarPosition) => {
        const leftComponents = components.filter(c => c.alignment === 'left');
        const centerComponents = components.filter(c => c.alignment === 'center');
        const rightComponents = components.filter(c => c.alignment === 'right');

        if (leftComponents.length === 0 && centerComponents.length === 0 && rightComponents.length === 0) {
            return null;
        }

        if ((position.includes('inner')) || (!isDetached && position.includes('outer'))) {
            return (
                <div 
                    className={`tools-bar tools-bar-${position}`} 
                    style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                    onFocusCapture={handleFocus}
                    tabIndex={0}
                    data-testid="tools-container"
                >
                    <div className="tools-bar-section tools-bar-section--left" style={{ display: leftComponents.length > 0 ? 'flex' : 'none'}}>
                        {leftComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <Component 
                                    key={`${item.identifier.type}-${item.identifier.name}-${idx}`} 
                                    areaState={areaState}
                                    onFocusCapture={handleFocus}
                                />
                            );
                        })}
                    </div>
                    <div className="tools-bar-section tools-bar-section--center" style={{ display: centerComponents.length > 0 ? 'flex' : 'none'}}>
                        {centerComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <Component 
                                    key={`${item.identifier.type}-${item.identifier.name}-${idx}`} 
                                    areaState={areaState}
                                    onFocusCapture={handleFocus}
                                />
                            );
                        })}
                    </div>
                    <div className="tools-bar-section tools-bar-section--right" style={{ display: rightComponents.length > 0 ? 'flex' : 'none'}}>
                        {rightComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <Component 
                                    key={`${item.identifier.type}-${item.identifier.name}-${idx}`} 
                                    areaState={areaState}
                                    onFocusCapture={handleFocus}
                                />
                            );
                        })}
                        {multiScreen && areaType === 'app' && position === 'bottom-outer' && <ScreenSwitcher />}
                    </div>
                </div>
            );
        }
        return null;
    };
console.log('====>', areaType, hasTopOuter, hasBottomOuter, topOuterHeight, bottomOuterHeight);
    return (
        <div
            className="tools-container"
            style={{
                top: viewport.top,
                left: viewport.left,
                //width: viewport.width,
                height: isDetached || isFullscreen ? '100%' : `calc(${viewport.height})`,
            }}
            onFocusCapture={handleFocus}
            tabIndex={0}
        >
            {renderToolbar(menuComponents, 'top-outer')}
            <div
                className="tools-content"
                style={{
                    height:isDetached || isFullscreen ? `calc(100% - ${bottomOuterHeight}px)` : `calc(${viewport?.height}${typeof viewport?.height === 'string' ? '' : 'px'} - ${topOuterHeight}px - ${bottomOuterHeight}px)`,
                }}
            >
                {renderToolbar(toolbarTopInnerComponents, 'top-inner')}
                {children}
                {renderToolbar(toolbarBottomInnerComponents, 'bottom-inner')}
            </div>
            {renderToolbar(statusComponents, 'bottom-outer')}
        </div>
    );
}; 
