import React, { useCallback } from 'react';
import { TOOLBAR_HEIGHT } from '../../../constants';
// Importer le nouveau composant
import { ScreenSwitcher } from './ScreenSwitcher';

// Type to uniquely identify a component
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Registry for status bar components
const statusBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    alignment: 'left' | 'center' | 'right';
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Custom hook for status bar
export const useStatusBar = (areaType: string, areaId: string, style?: React.CSSProperties) => {
    // Create a unique key for this type:id combination
    const registryKey = `${areaType}:${areaId}`;

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: {
            order?: number;
            alignment?: 'left' | 'center' | 'right';
            width?: string | number;
        } = {}
    ) => {
        const { order = 0, alignment = 'left', width } = options;

        // Clean up existing components before adding new ones
        if (!statusBarComponentRegistry[registryKey]) {
            statusBarComponentRegistry[registryKey] = [];
        } else {
            // Keep only components with different identifiers
            statusBarComponentRegistry[registryKey] = statusBarComponentRegistry[registryKey].filter(
                item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
            );
        }

        const id = Math.random().toString(36).substr(2, 9);
        statusBarComponentRegistry[registryKey].push({
            component,
            order,
            alignment,
            width,
            identifier
        });

        // Sort components by order
        statusBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Function to retrieve components
    const getComponents = useCallback(() => {
        return statusBarComponentRegistry[registryKey] || [];
    }, [registryKey]);

    // Clean up components when unmounting
    React.useEffect(() => {
        return () => {
            delete statusBarComponentRegistry[registryKey];
        };
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
};

interface StatusBarProps {
    areaId: string;
    areaState: any;
    areaType: string;
    style?: React.CSSProperties;
}

export const StatusBar: React.FC<StatusBarProps> = ({ areaId, areaState, areaType, style }) => {
    const { getComponents } = useStatusBar(areaType, areaId);
    const components = getComponents();
    // Log de debug
    console.log('[StatusBar] props:', { areaId, areaType, areaState, style });
    console.log('[StatusBar] children components:', components);

    // Organize components by alignment
    const leftComponents = components.filter(c => c.alignment === 'left');
    const centerComponents = components.filter(c => c.alignment === 'center');
    const rightComponents = components.filter(c => c.alignment === 'right');

    // Définir le style de base pour la barre de statut
    const statusBarStyle: React.CSSProperties = {
        height: TOOLBAR_HEIGHT + 'px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px', // Ajouter un peu de padding
        background: '#222', // Fond sombre
        color: '#ccc', // Texte clair
        fontSize: '12px',
        borderTop: '1px solid #444' // Ligne de séparation
    };

    // Définir le style pour les sections
    const sectionStyle: React.CSSProperties = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    return (
        <div className="karmyc-status-bar" style={{...statusBarStyle, ...style}}>
            {/* Section Gauche */}
            <div className="karmyc-status-bar-section left" style={{ ...sectionStyle, justifyContent: 'flex-start' }}>
                {leftComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="karmyc-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>

            {/* Section Centre */}
            <div className="karmyc-status-bar-section center" style={{ ...sectionStyle, justifyContent: 'center' }}>
                {centerComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="karmyc-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>

            {/* Section Droite - Ajouter le ScreenSwitcher conditionnellement */}
            <div className="karmyc-status-bar-section right" style={{ ...sectionStyle, justifyContent: 'flex-end' }}>
                {/* Composants enregistrés pour la droite */}
                {rightComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="karmyc-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
                {/* Afficher le ScreenSwitcher SEULEMENT si areaType est "app" */}
                {areaType === 'app' && <ScreenSwitcher />}
            </div>
        </div>
    );
}; 
