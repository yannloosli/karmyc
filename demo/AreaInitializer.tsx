import React, { useEffect, useMemo } from 'react';

import {
    actionRegistry,
    areaRegistry,
    useArea,
    useRegisterAreaType,
    useKarmycStore,
    useToolsSlot,
    EmptyAreaMessage,
    AREA_ROLE
} from '..';

export const AreaInitializer: React.FC<{}> = ({}) => {
    const { updateArea } = useKarmycStore.getState();

    // Utiliser le hook unifié pour chaque barre
    const { registerComponent: registerRootStatusComponent } = useToolsSlot('app', 'root', 'bottom-outer');
    const { registerComponent: registerRootMenuComponent } = useToolsSlot('app', 'root', 'top-outer');
    const { registerComponent: registerRootMenuDemoArea1 } = useToolsSlot('demo-area-1', 'demo-area-1', 'top-outer');

    // Enregistrement dans un useEffect pour éviter les effets de bord
    useMemo(() => {
        registerRootStatusComponent(
            () => <div>Bottom outer slot</div>,
            { name: 'bottomOuterSlot', type: 'status' },
            { order: 990, alignment: 'right', width: 'auto' }
        );
        registerRootMenuComponent(
            () => <div>Top outer left slot</div>,
            { name: 'topOuterLeftSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
        registerRootMenuDemoArea1(
            () => <div>Top Demo Area 1 center slot</div>,
            { name: 'topOuterRightSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
    }, [registerRootStatusComponent, registerRootMenuComponent, registerRootMenuDemoArea1]);

     // Register all area types
    useRegisterAreaType(
        'demo-area-1',
        EmptyAreaMessage,
        {},
        {
            displayName: 'Demo area 1',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.LEAD
        }
    );

    useRegisterAreaType(
        'demo-area-2',
        EmptyAreaMessage,
        {},
        {
            displayName: 'Demo area 2',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.SELF
        }
    );



    

    // Action handlers for area creation (utilisation de updateArea Zustand)
    const handleDemoArea1 = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'demo-area-1',
                state: areaRegistry.getInitialState('demo-area-1')
            });
        }
    };

    const handleDemoArea2 = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'demo-area-2',  
                state: areaRegistry.getInitialState('demo-area-2')
            });
        }
    };
    

   
    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-demo-area-1', handleDemoArea1);
        actionRegistry.registerActionHandler('area.create-demo-area-2', handleDemoArea2);

        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-demo-area-1');
            actionRegistry.unregisterActionHandler('area.create-demo-area-2');
        };
    }, [updateArea]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('demo-area-1');
            areaRegistry.unregisterAreaType('demo-area-2');
        };
    }, []);


    return null;
};
