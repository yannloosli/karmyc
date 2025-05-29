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
    const { createArea } = useArea();

    // Utiliser le hook unifié pour chaque barre
  //  const { registerComponent: registerRootStatusComponent } = useToolsSlot('app', 'root', 'bottom-outside', false);
  //  const { registerComponent: registerRootMenuComponent } = useToolsSlot('app', 'root', 'top-outside', false);

    // Enregistrement dans un useEffect pour éviter les effets de bord
  /*   useEffect(() => {
        registerRootStatusComponent(
            ResetProjectButton,
            { name: 'resetProjectButton', type: 'status' },
            { order: 990, alignment: 'right', width: 'auto' }
        );
        registerRootStatusComponent(
            ShowGridButton,
            { name: 'showGridButton', type: 'status' },
            { order: 999, alignment: 'right', width: 'auto' }
        );
        registerRootStatusComponent(
            Themer,
            { name: 'themer', type: 'status' },
            { order: 999, alignment: 'left', width: 'auto' }
        );
        registerRootStatusComponent(
            ResponsiveToolBar,
            { name: 'responsiveToolBar', type: 'status' },
            { order: 999, alignment: 'center', width: 'auto' }
        );
        registerRootMenuComponent(
            HeaderMenu,
            { name: 'headerMenu', type: 'menu' },
            { order: 990, width: 'auto' }
        );
        registerRootMenuComponent(
            FileMenu,
            { name: 'fileMenu', type: 'menu' },
            { order: 10, width: 'auto', callback: [handleShowMenu, handleCloseSpace] }
        );
        registerRootMenuComponent(
            CodeSandboxButton,
            { name: 'codeSandboxButton', type: 'codeSandboxButton' },
            { order: 999, width: 'auto' }
        );
    }, [registerRootStatusComponent, registerRootMenuComponent]); */

    /* useMemo(() => {
        registerRootStatusComponent(
            ResetButtonWrapper,
            {
                name: 'resetButton',
                type: 'status'
            },
            {
                order: 999,
                alignment: 'right',
                width: 'auto'
            }
        );
    }, [registerRootStatusComponent]); */

    // Register all area types
    useRegisterAreaType(
        'demo-area-1',
        EmptyAreaMessage,
        {},
        {
            displayName: 'Demo area 1',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.SELF
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
                type: 'demo-area',
                state: areaRegistry.getInitialState('demo-area')
            });
        }
    };

    const handleDemoArea2 = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'demo-area',  
                state: areaRegistry.getInitialState('demo-area')
            });
        }
    };
    

   
    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-demo-area', handleDemoArea1);
        actionRegistry.registerActionHandler('area.create-demo-area', handleDemoArea2);

        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-demo-area-1');
            actionRegistry.unregisterActionHandler('area.create-demo-area-2');
        };
    }, [updateArea]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('demo-area');
        };
    }, []);


    return null;
};
