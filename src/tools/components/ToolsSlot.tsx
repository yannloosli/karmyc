import React, { useCallback, useEffect } from 'react';
import { ScreenSwitcher } from '../../core/ui/ScreenSwitcher';
import { useActiveLayerInfo } from '../../../../website/app/(main-app)/[lng]/(pages)/curry/plugins/layeredWorkspace/hools/useActiveLayerInfo';
import { useKarmycStore } from '../../core/data/areaStore';
import { TOOLBAR_HEIGHT } from '../../core/utils/constants';
import { Rect } from '../../core/types/math';

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
 * @param position Position de la barre
 */
export function useToolsSlot(
    areaType: string,
    position: ToolsBarPosition,
) {
    // Utiliser uniquement le type d'area et la position comme clé
    const registryKey = `${areaType}:${position}`;

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
    areaType: string;
    areaState: any;
    children: React.ReactNode;
    style?: React.CSSProperties;
    viewport?: Rect;
}

export const Tools: React.FC<ToolsProps> = ({
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
    useToolsRegistrySubscription();
    const { getComponents: getMenuComponents } = useToolsSlot(areaType, 'top-outer');
    const { getComponents: getStatusComponents } = useToolsSlot(areaType, 'bottom-outer');
    const { getComponents: getToolbarTopInner } = useToolsSlot(areaType, 'top-inner');
    const { getComponents: getToolbarBottomInner } = useToolsSlot(areaType, 'bottom-inner');

    const menuComponents = getMenuComponents();
    const statusComponents = getStatusComponents();
    const toolbarTopInnerComponents = getToolbarTopInner();
    const toolbarBottomInnerComponents = getToolbarBottomInner();

    const { activeLayerType } = useActiveLayerInfo();
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const multiScreen = useKarmycStore((state) => state.options.multiScreen) || false;

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
                    <div className="tools-bar-section tools-bar-section--left" style={{ display: leftComponents.length > 0 ? 'flex' : 'none'}}>
                        {leftComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <Component key={`${item.identifier.type}-${item.identifier.name}-${idx}`} areaState={areaState} />
                            );
                        })}
                    </div>
                    <div className="tools-bar-section tools-bar-section--center" style={{ display: centerComponents.length > 0 ? 'flex' : 'none'}}>
                        {centerComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <Component key={`${item.identifier.type}-${item.identifier.name}-${idx}`} areaState={areaState} />
                            );
                        })}
                    </div>
                    <div className="tools-bar-section tools-bar-section--right" style={{ display: rightComponents.length > 0 ? 'flex' : 'none'}}>
                        {rightComponents.map((item, idx) => {
                            const Component = item.component;
                            return (
                                <Component key={`${item.identifier.type}-${item.identifier.name}-${idx}`} areaState={areaState} />
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
                width: viewport.width,
                height: isDetached ? '100%' : `calc(${viewport.height})`,
            }}>
            {renderToolbar(menuComponents, 'top-outer')}
            <div
                className="tools-content"
                style={{
                    height:isDetached ? '100%' : `calc(${viewport?.height}${typeof viewport?.height === 'string' ? '' : 'px'} - ${topOuterHeight}px - ${bottomOuterHeight}px)`,
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
