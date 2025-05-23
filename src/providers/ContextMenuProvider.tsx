import React from 'react';
import { ContextMenu } from '../components/ContextMenu';
import { useRegisterActionHandler } from '../hooks';
import { useKarmycStore} from '../stores/areaStore';

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const removeArea = useKarmycStore((state) => state.removeArea);
    const updateArea = useKarmycStore((state) => state.updateArea);
    const detachArea = useKarmycStore((state) => state.detachArea);
    // const allSpaces = useSpaceStore((state) => state.getAllSpaces()); // plus besoin

    useRegisterActionHandler('area.close', (params) => {
        if (params?.areaId) {
            removeArea(params.areaId);
        }
    }, {
        menuType: 'area-menu',
        label: 'Fermer',
        order: 100
    });

    useRegisterActionHandler('area.detach', (params) => {
        if (params?.areaId) {
            detachArea(params.areaId);
        }
    }, {
        menuType: 'area-menu',
        label: 'Détacher',
        order: 150
    });

    // Handler générique pour assigner un espace à une area
    useRegisterActionHandler('area.assign-space', (params) => {
        if (params?.areaId && params?.spaceId) {
            updateArea({ id: params.areaId, spaceId: params.spaceId });
        }
    }, {
        menuType: 'area-menu',
        label: 'Assigner à un espace',
        order: 200
    });

    return (
        <>
            {children}
            <ContextMenu />
        </>
    );
}; 
