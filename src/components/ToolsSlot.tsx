import React, { useCallback, useEffect, useMemo } from 'react';
import { ScreenSwitcher } from './ScreenSwitcher';
import { TOOLBAR_HEIGHT } from '../utils/constants';
import { Rect } from '../types/math';
import { useToolsState } from '../hooks/useToolsState';
import { useToolsScreenState } from '../hooks/useToolsScreenState';
import { toolsBarRegistry, subscribeToRegistryChanges, toolsBarLinesRegistry, notifyToolsRegistryChange } from '../utils/toolsRegistry';
import { useToolsCleanup } from '../hooks/useToolsCleanup';

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
export interface ToolsBarComponent {
    component: React.ComponentType<any>;
    order: number;
    alignment: ToolsBarAlignment;
    width?: string | number;
    identifier: ComponentIdentifier;
    allowedLayerTypes?: string[];
    callback?: (() => void)[];
}

// Créer un contexte pour les Tools
const ToolsContext = React.createContext<{
    areaId?: string;
    areaType?: string;
}>({});

// Hook pour utiliser le contexte Tools
function useToolsContext() {
    return React.useContext(ToolsContext);
}

// Hook pour enregistrer les composants
export function useToolsSlot(
    key: string,
    position: ToolsBarPosition,
    nbOfLines?: number
) {
    const { areaId, areaType } = useToolsContext();
    const registryKey = `${key}:${position}`;

    // Si nous sommes dans un contexte Tools, utiliser l'areaId/areaType du contexte
    const effectiveKey = areaId || areaType || key;

    console.log('useToolsSlot - Input:', { key, position, nbOfLines, registryKey, effectiveKey });
    console.log('useToolsSlot - Current registry value:', toolsBarLinesRegistry[registryKey]);

    // Déplacer la mise à jour du registre dans un useEffect
    useEffect(() => {
        if (nbOfLines !== undefined) {
            const currentValue = toolsBarLinesRegistry[registryKey] ?? 1;
            if (currentValue < nbOfLines) {
                console.log('useToolsSlot - Updating registry value from', currentValue, 'to', nbOfLines);
                toolsBarLinesRegistry[registryKey] = nbOfLines;
                notifyToolsRegistryChange();
            }
        }
    }, [registryKey, nbOfLines]);

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

    const getLines = useCallback(() => {
        const lines = toolsBarLinesRegistry[registryKey] || 1;
        console.log('getLines - Called for', registryKey, 'returning', lines);
        return lines;
    }, [registryKey]);

    return {
        registerComponent,
        getComponents,
        getLines
    };
}

// Fonction utilitaire pour combiner et dédupliquer les composants
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

// Hook pour utiliser les composants enregistrés
function useToolsComponents(areaId?: string, areaType?: string, nbOfLines?: number) {
    // Appeler les hooks au niveau supérieur
    const menuById = useToolsSlot(areaId || '', 'top-outer', nbOfLines);
    const menuByType = useToolsSlot(areaType || '', 'top-outer', nbOfLines);
    const statusById = useToolsSlot(areaId || '', 'bottom-outer', nbOfLines);
    const statusByType = useToolsSlot(areaType || '', 'bottom-outer', nbOfLines);
    const toolbarTopInnerById = useToolsSlot(areaId || '', 'top-inner', nbOfLines);
    const toolbarTopInnerByType = useToolsSlot(areaType || '', 'top-inner', nbOfLines);
    const toolbarBottomInnerById = useToolsSlot(areaId || '', 'bottom-inner', nbOfLines);
    const toolbarBottomInnerByType = useToolsSlot(areaType || '', 'bottom-inner', nbOfLines);

    // Mémoriser les résultats des combinaisons
    const menuComponents = useMemo(() => 
        combineAndDedupe(
            menuById.getComponents(),
            menuByType.getComponents()
        ),
        [menuById, menuByType]
    );

    const menuNbOfLines = useMemo(() => 
        Math.max(
            menuById.getLines(),
            menuByType.getLines()
        ),
        [menuById, menuByType]
    );

    const statusComponents = useMemo(() => 
        combineAndDedupe(
            statusById.getComponents(),
            statusByType.getComponents()
        ),
        [statusById, statusByType]
    );

    const statusNbOfLines = useMemo(() => 
        Math.max(
            statusById.getLines(),
            statusByType.getLines()
        ),
        [statusById, statusByType]
    );

    const toolbarTopInnerComponents = useMemo(() => 
        combineAndDedupe(
            toolbarTopInnerById.getComponents(),
            toolbarTopInnerByType.getComponents()
        ),
        [toolbarTopInnerById, toolbarTopInnerByType]
    );

    const toolbarTopInnerNbOfLines = useMemo(() => 
        Math.max(
            toolbarTopInnerById.getLines(),
            toolbarTopInnerByType.getLines()
        ),
        [toolbarTopInnerById, toolbarTopInnerByType]
    );

    const toolbarBottomInnerComponents = useMemo(() => 
        combineAndDedupe(
            toolbarBottomInnerById.getComponents(),
            toolbarBottomInnerByType.getComponents()
        ),
        [toolbarBottomInnerById, toolbarBottomInnerByType]
    );

    const toolbarBottomInnerNbOfLines = useMemo(() => 
        Math.max(
            toolbarBottomInnerById.getLines(),
            toolbarBottomInnerByType.getLines()
        ),
        [toolbarBottomInnerById, toolbarBottomInnerByType]
    );
console.log(areaType, menuNbOfLines)
    return {
        menuComponents,
        menuNbOfLines,
        statusComponents,
        statusNbOfLines,
        toolbarTopInnerComponents,
        toolbarTopInnerNbOfLines,
        toolbarBottomInnerComponents,
        toolbarBottomInnerNbOfLines
    };
}

// Hook for subscribing to registry changes (useSyncExternalStore)
function useToolsRegistrySubscription() {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    useEffect(() => {
        return subscribeToRegistryChanges(forceUpdate);
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
    nbOfLines?: number;
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
    },
    nbOfLines = 1,
}) => {
    useToolsRegistrySubscription();
    useToolsCleanup();

    const {
        menuComponents,
        menuNbOfLines,
        statusComponents,
        statusNbOfLines,
        toolbarTopInnerComponents,
        toolbarTopInnerNbOfLines,
        toolbarBottomInnerComponents,
        toolbarBottomInnerNbOfLines
    } = useToolsComponents(areaId, areaType, nbOfLines);

    const {
        handleFocus,
    } = useToolsState(areaId);

    const {
        isDetached,
        multiScreen
    } = useToolsScreenState();

    // Calculate toolbar heights
    const hasTopOuter = menuComponents.length > 0;
    const hasBottomOuter = statusComponents.length > 0;
    const hasTopInner = toolbarTopInnerComponents.length > 0;
    const hasBottomInner = toolbarBottomInnerComponents.length > 0;

    const topOuterHeight = hasTopOuter ? TOOLBAR_HEIGHT * menuNbOfLines : 0;
    const bottomOuterHeight = hasBottomOuter ? TOOLBAR_HEIGHT * statusNbOfLines : 0;

    // Organize by alignment and filter for each position
    const renderToolbar = (components: ToolsBarComponent[], position: ToolsBarPosition, nbOfLines: number) => {
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
                    style={{
                        height: TOOLBAR_HEIGHT * nbOfLines,
                        minHeight: TOOLBAR_HEIGHT,
                        position: position.includes('outer') ? 'absolute' : 'relative',
                        left: 0,
                        right: 0,
                        ...(position.includes('bottom') ? { bottom: 0 } : { top: 0 })
                    }}
                    onFocusCapture={handleFocus}
                    tabIndex={0}
                    data-testid={`tools-bar-${position}`}
                >
                    <div className="tools-bar-section tools-bar-section--left" style={{ display: leftComponents.length > 0 ? 'flex' : 'none' }}>
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
                    <div className="tools-bar-section tools-bar-section--center" style={{ display: centerComponents.length > 0 ? 'flex' : 'none' }}>
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
                    <div className="tools-bar-section tools-bar-section--right" style={{ display: rightComponents.length > 0 ? 'flex' : 'none' }}>
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

    return (
        <ToolsContext.Provider value={{ areaId, areaType }}>
            <div
                className="tools-container"
                style={{
                    position: 'relative',
                    width: viewport.width,
                    height: isDetached ? '100%' : 'calc(100%)',
                    overflow: 'hidden'
                }}
                data-testid="tools-container"
            >
                <div
                    className="tools-content"
                    style={{
                        position: 'absolute',
                        top: topOuterHeight,
                        left: 0,
                        right: 0,
                        bottom: bottomOuterHeight,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    data-testid="tools-content"
                >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {children}
                    </div>
                </div>

                {hasTopOuter && renderToolbar(menuComponents, 'top-outer', menuNbOfLines)}
                {hasBottomOuter && renderToolbar(statusComponents, 'bottom-outer', statusNbOfLines)}
                {hasTopInner && renderToolbar(toolbarTopInnerComponents, 'top-inner', toolbarTopInnerNbOfLines)}
                {hasBottomInner && renderToolbar(toolbarBottomInnerComponents, 'bottom-inner', toolbarBottomInnerNbOfLines)}
            </div>
        </ToolsContext.Provider>
    );
}; 
