import React, { useCallback, useEffect, useRef } from 'react';
import { ScreenSwitcher } from './ScreenSwitcher';
import { css } from '@emotion/css';

// Type pour identifier un composant de façon unique
export type ComponentIdentifier = {
    name: string;
    type: string;
};

// Alignement possible dans la barre
export type ToolsBarAlignment = 'left' | 'center' | 'right';

// Positionnement de la barre
export type ToolsBarPosition =
    | 'top-outside'
    | 'top-inside'
    | 'bottom-outside'
    | 'bottom-inside';

// Structure d'un composant enregistré
interface ToolsBarComponent {
    component: React.ComponentType<any>;
    order: number;
    alignment: ToolsBarAlignment;
    width?: string | number;
    identifier: ComponentIdentifier;
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
 * @param cleanupOnUnmount Si true (défaut), nettoie le registre à l'unmount. Sinon, garde les composants enregistrés.
 */
export function useToolsBar(
    areaType: string,
    areaId: string,
    position: ToolsBarPosition,
    cleanupOnUnmount: boolean = true
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
            } = {}
        ) => {
            const { order = 0, alignment = 'left', width } = options;
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
                identifier
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

    // Nettoyage à l'unmount (optionnel)
    useEffect(() => {
        if (!cleanupOnUnmount) return;
        return () => {
            delete toolsBarRegistry[registryKey];
            notifyToolsRegistryChange();
        };
    }, [registryKey, cleanupOnUnmount]);

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
    position: ToolsBarPosition;
    style?: React.CSSProperties;
    forceRender?: boolean;
}

const toolsBarSection = css`
    display: flex;
    align-items: center;
    flex: 1;
    gap: 8px;
`;
const toolsBarSectionLeft = css`
    justify-content: flex-start;
`;
const toolsBarSectionCenter = css`
    justify-content: center;
`;
const toolsBarSectionRight = css`
    justify-content: flex-end;
`;

export const Tools: React.FC<ToolsProps> = ({
    areaId,
    areaType,
    areaState,
    position,
    style,
    forceRender = false
}) => {
    useToolsRegistrySubscription(); // Force le re-render sur changement du registre
    const { getComponents } = useToolsBar(areaType, areaId, position);
    const components = getComponents();

    // Organiser par alignement
    const left = components.filter(c => c.alignment === 'left');
    const center = components.filter(c => c.alignment === 'center');
    const right = components.filter(c => c.alignment === 'right');

    // Ne rien rendre si vide, sauf si forceRender
    if (!forceRender && left.length === 0 && center.length === 0 && right.length === 0) {
        return null;
    }

    return (
        <div className={`tools-bar tools-bar-${position}`} style={style}>
            <div className={"tools-bar-section left " + toolsBarSection + " " + toolsBarSectionLeft}>
                {left.map((item, idx) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${idx}`} style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
            <div className={"tools-bar-section center " + toolsBarSection + " " + toolsBarSectionCenter}>
                {center.map((item, idx) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${idx}`} style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
            <div className={"tools-bar-section right " + toolsBarSection + " " + toolsBarSectionRight}>
                {right.map((item, idx) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${idx}`} style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
                {/* Afficher le ScreenSwitcher SEULEMENT si areaType est 'app' et position est 'bottom-outside' */}
                {areaType === 'app' && position === 'bottom-outside' && <ScreenSwitcher />}
            </div>
        </div>
    );
}; 
