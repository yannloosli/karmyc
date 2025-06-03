import React from 'react';
import { AREA_ROLE, AreaTypeValue, areaRegistry, useKarmycStore } from '..';
import { ControlledMenu } from '@szhsin/react-menu';
import { useContextMenuStore } from '../data/contextMenuStore';

// Récupère la map des rôles
const getRoleMap = () => (areaRegistry as any)._roleMap || {};

export const SwitchAreaTypeContextMenu: React.FC = () => {
    const isVisible = useContextMenuStore((state) => state.isVisible && state.menuType === 'custom');
    const position = useContextMenuStore((state) => state.position);
    const closeContextMenu = useContextMenuStore((state) => state.closeContextMenu);
    const metadata = useContextMenuStore((state) => state.metadata);
    const targetId = useContextMenuStore((state) => state.targetId) || "";

    const roleMap = getRoleMap();
    const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());

    // Regroupe les types par rôle
    const columns = [
        { role: AREA_ROLE.LEAD, title: 'LEAD', items: [] as string[] },
        { role: AREA_ROLE.FOLLOW, title: 'FOLLOW', items: [] as string[] },
        { role: AREA_ROLE.SELF, title: 'SELF', items: [] as string[] },
    ];
    registeredTypes.forEach(type => {
        const role = roleMap[type] || AREA_ROLE.SELF;
        const col = columns.find(c => c.role === role);
        if (col) col.items.push(type);
    });

    const handleChangeType = (newType: AreaTypeValue) => {
        useKarmycStore.getState().updateArea({ id: targetId, type: newType });
        if (closeContextMenu) closeContextMenu();
    };
    console.log('isVisible', isVisible);
    return (
        <ControlledMenu
            anchorPoint={position}
            state={isVisible ? 'open' : 'closed'}
            onClose={closeContextMenu}
            transition
            direction="right"
            menuClassName={'switch-area-type-context-menu'}
        >
            {columns.map(col => (
                <div key={col.role} style={{ flex: 1, margin: '0 8px', width: '250px' }}>
                    <div style={{ padding: '4px 0 16px', marginBottom: 8, textAlign: 'left', borderBottom: '2px ridge #444', paddingBottom: 4 }}>{col.title}</div>
                    {col.items.map(type => {
                        const Icon = areaRegistry.getIcon(type);
                        return (
                            <div
                                key={type}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}
                                onClick={() => handleChangeType(type)}
                                onMouseDown={e => e.preventDefault()}
                            >
                                <Icon style={{ width: 16, height: 16 }} />
                                {areaRegistry.getDisplayName(type)}
                            </div>
                        )
                    })}
                </div>
            ))}
        </ControlledMenu>
    );
};

export default SwitchAreaTypeContextMenu; 
