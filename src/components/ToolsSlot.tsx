import React, { useCallback, useEffect } from 'react';
import { ScreenSwitcher } from './ScreenSwitcher';
import { useKarmycStore } from '../store/areaStore';
import { TOOLBAR_HEIGHT } from '../utils/constants';
import { Rect } from '../types/math';
import { useSpaceStore } from '../store/spaceStore';

// Type pour identifier un composant de façon unique
export type ComponentIdentifier = {
    name: string;
    type: string;
};

// Alignement possible dans la barre
export type ToolsBarAlignment = 'left' | 'center' | 'right';

// Positionnement de la barre
export type ToolsBarPosition =
    | 'top-outer'
    | 'top-inner'
    | 'bottom-outer'
    | 'bottom-inner'
    | string;

// Structure d'un composant enregistré
interface ToolsBarComponent {
    component: React.ComponentType<any>;
    order: number;
    alignment: ToolsBarAlignment;
    width?: string | number;
    identifier: ComponentIdentifier;
    allowedLayerTypes?: string[];
    callback?: (() => void)[];
}

// Registre global
const toolsBarRegistry: Record<string, ToolsBarComponent[]> = {};

// Système d'abonnement pour la réactivité du registre
const listeners = new Set<() => void>();
function notifyToolsRegistryChange() {
    listeners.forEach((cb) => cb());
}

// Hook d'enregistrement
/**
 * Hook pour enregistrer dynamiquement des composants dans une barre Tools.
 * @param key ID de l'area ou type d'area
 * @param position Position de la barre
 */
export function useToolsSlot(
    key: string,
    position: ToolsBarPosition,
) {
    // Utiliser la clé (ID ou type) et la position comme clé de registre
    const registryKey = `${key}:${position}`;

    // Enregistrer un composant dans la barre
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

    // Récupérer les composants enregistrés
    const getComponents = useCallback(() => {
        return toolsBarRegistry[registryKey] || [];
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
}

// Hook pour s'abonner aux changements du registre (useSyncExternalStore)
function useToolsRegistrySubscription() {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    useEffect(() => {
        listeners.add(forceUpdate);
        return () => {
            listeners.delete(forceUpdate);
        };
    }, []);
}

// Props du composant Tools
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
    const key = areaId || areaType;
    useToolsRegistrySubscription();
    const { getComponents: getMenuComponents } = useToolsSlot(key, 'top-outer');
    const { getComponents: getStatusComponents } = useToolsSlot(key, 'bottom-outer');
    const { getComponents: getToolbarTopInner } = useToolsSlot(key, 'top-inner');
    const { getComponents: getToolbarBottomInner } = useToolsSlot(key, 'bottom-inner');

    const menuComponents = getMenuComponents();
    const statusComponents = getStatusComponents();
    const toolbarTopInnerComponents = getToolbarTopInner();
    const toolbarBottomInnerComponents = getToolbarBottomInner();

    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const multiScreen = useKarmycStore((state) => state.options.multiScreen) || false;

    // Récupérer l'ID de l'area et son espace associé
    const currentArea = useKarmycStore(state => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return undefined;
        // L'activation de l'espace par focus ne s'applique qu'aux areas avec un ID
        return areaId ? Object.values(activeScreenAreas.areas).find(area => area.id === areaId) : undefined;
    });
    const currentSpaceId = currentArea?.spaceId;

    // Gestionnaire de focus pour activer l'espace
    const handleFocus = useCallback(() => {
        if (currentSpaceId) {
            useSpaceStore.getState().setActiveSpace(currentSpaceId);
        }
    }, [currentSpaceId]);

    // Calculer les hauteurs des toolbars
    const hasTopOuter = menuComponents.length > 0;
    const hasBottomOuter = statusComponents.length > 0;

    const topOuterHeight = hasTopOuter ? TOOLBAR_HEIGHT : 0;
    const bottomOuterHeight = hasBottomOuter ? TOOLBAR_HEIGHT : 0;

    const isFullscreen = currentArea?.enableFullscreen ?? false;

    // Organiser par alignement et filtrer pour chaque position
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
