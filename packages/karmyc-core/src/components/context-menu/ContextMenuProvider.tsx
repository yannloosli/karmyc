import React from 'react';
import { CustomContextMenu } from './CustomContextMenu';
import { NormalContextMenu } from './normal/NormalContextMenu';
import { useRegisterActionHandler } from '../../hooks/useRegisterActionHandler';
import { useKarmycStore } from '../../stores/areaStore';
import { useSpaceStore } from '../../stores/spaceStore';

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const removeArea = useKarmycStore((state) => state.removeArea);
    const updateArea = useKarmycStore((state) => state.updateArea);
    // const allSpaces = useSpaceStore((state) => state.getAllSpaces()); // plus besoin

    useRegisterActionHandler('area.close', (params) => {
        if (params?.areaId) {
            removeArea(params.areaId);
        }
    });

    // Handler générique pour assigner un espace à une area
    useRegisterActionHandler('area.assign-space', (params) => {
        if (params?.areaId && params?.spaceId) {
            updateArea({ id: params.areaId, spaceId: params.spaceId });
        }
    });

    return (
        <>
            {children}
            <CustomContextMenu />
            <NormalContextMenu />
        </>
    );
}; 
