import React, { useCallback, useEffect } from 'react';
import { ScreenSwitcher } from '../../core/ui/ScreenSwitcher';
import { useActiveLayerInfo } from '../../garbage/hooks/useActiveLayerInfo';
import { useKarmycStore } from '../../core/data/areaStore';
import { TOOLBAR_HEIGHT } from '../../core/utils/constants';

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
 * @param areaType Type d'area
 * @param areaId ID de l'area
 * @param position Position de la barre
 */
export function useToolsSlot(
    areaType: string,
    areaId: string,
    position: ToolsBarPosition,
) {
    const registryKey = `${areaType}:${areaId}:${position}`;

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
    areaId: string;
    areaType: string;
    areaState: any;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export const Tools: React.FC<ToolsProps> = ({
    areaId = 'root',
    areaType = 'app',
    areaState = {},
    children,
    style = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
    },
}) => {
    useToolsRegistrySubscription();
    const { getComponents: getMenuComponents } = useToolsSlot(areaType, areaId, 'top-outer');
    const { getComponents: getStatusComponents } = useToolsSlot(areaType, areaId, 'bottom-outer');
    const { getComponents: getToolbarTopInner } = useToolsSlot(areaType, areaId, 'top-inner');
    const { getComponents: getToolbarBottomInner } = useToolsSlot(areaType, areaId, 'bottom-inner');

    const menuComponents = getMenuComponents();
    const statusComponents = getStatusComponents();
    const toolbarTopInnerComponents = getToolbarTopInner();
    const toolbarBottomInnerComponents = getToolbarBottomInner();

    const { activeLayerType } = useActiveLayerInfo();
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;

    // Calculer les hauteurs des toolbars
    const hasTopOuter = menuComponents.length > 0;
    const hasBottomOuter = statusComponents.length > 0;

    const topOuterHeight = hasTopOuter ? TOOLBAR_HEIGHT : 0;
    const bottomOuterHeight = hasBottomOuter ? TOOLBAR_HEIGHT : 0;

    // Fonction de filtrage des composants
    const filterComponentsByLayerType = (comps: ToolsBarComponent[]): ToolsBarComponent[] => {
        return comps.filter(comp => {
            if (!comp.allowedLayerTypes || comp.allowedLayerTypes.length === 0) {
                return true;
            }
            return activeLayerType ? comp.allowedLayerTypes.includes(activeLayerType) : false;
        });
    };

    // Organiser par alignement et filtrer pour chaque position
    const renderToolbar = (components: ToolsBarComponent[], position: ToolsBarPosition) => {
        const leftComponents = filterComponentsByLayerType(components.filter(c => c.alignment === 'left'));
        const centerComponents = filterComponentsByLayerType(components.filter(c => c.alignment === 'center'));
        const rightComponents = filterComponentsByLayerType(components.filter(c => c.alignment === 'right'));

        if (leftComponents.length === 0 && centerComponents.length === 0 && rightComponents.length === 0) {
            return null;
        }

        if ((position.includes('inner')) || (!isDetached && position.includes('outer'))) {
            return (
                <div className={`tools-bar tools-bar-${position}`} style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}>
                    <div className="tools-bar-section tools-bar-section--left">
                        {leftComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <div key={`${item.identifier.type}-${item.identifier.name}-${idx}`} style={{ width: item.width }}>
                                    <Component areaId={areaId} areaState={areaState} />
                                </div>
                            );
                        })}
                    </div>
                    <div className="tools-bar-section tools-bar-section--center">
                        {centerComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <div key={`${item.identifier.type}-${item.identifier.name}-${idx}`} style={{ width: item.width }}>
                                    <Component areaId={areaId} areaState={areaState} />
                                </div>
                            );
                        })}
                    </div>
                    <div className="tools-bar-section tools-bar-section--right">
                        {rightComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <div key={`${item.identifier.type}-${item.identifier.name}-${idx}`} style={{ width: item.width }}>
                                    <Component areaId={areaId} areaState={areaState} />
                                </div>
                            );
                        })}
                        {areaType === 'app' && position === 'bottom-outer' && <ScreenSwitcher />}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="tools-container"
            style={style}>
            {renderToolbar(menuComponents, 'top-outer')}
            <div
                className="tools-content"
                style={{
                    height: `calc(${style?.height}${typeof style?.height === 'string' ? '' : 'px'} - ${isDetached ? 0 : (topOuterHeight + bottomOuterHeight)}px)`,
                    position: 'relative'
                }}
            >
                {renderToolbar(toolbarTopInnerComponents, 'top-inner')}
                <div
                    style={{
                        height: `100%`,
                        position: 'relative',
                        overflow: 'auto'
                    }}
                >
                    {children}
                </div>
                {renderToolbar(toolbarBottomInnerComponents, 'bottom-inner')}
            </div>
            {renderToolbar(statusComponents, 'bottom-outer')}
        </div>
    );
}; 
