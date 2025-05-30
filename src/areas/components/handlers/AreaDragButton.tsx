import { useRef, useState } from "react";
import { AreaTypeValue, useKarmycStore, useContextMenuStore } from "../../../core";
import { useAreaContextMenu } from '../../hooks/useAreaContextMenu';
import { useSpaceStore } from "../../../core/data/spaceStore";
import useAreaDragAndDrop from "../../hooks/useAreaDragAndDrop";

interface IAreaDragButton {
    state: any;
    type: AreaTypeValue;
    id: string;
    style?: React.CSSProperties;
}

export const AreaDragButton = ({ state, type, id, style }: IAreaDragButton) => {
    const [isDragging, setIsDragging] = useState(false);
    const {
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    } = useAreaDragAndDrop({ type, id, state });

    const contextMenuItems = useAreaContextMenu(id);
    const openContextMenuAction = useContextMenuStore((state) => state.openContextMenu);

    // Ref pour le bouton
    const selectAreaButtonRef = useRef<HTMLButtonElement>(null);
    const openSelectArea = (_: React.MouseEvent) => {
        if (selectAreaButtonRef.current) {
            const rect = selectAreaButtonRef.current.getBoundingClientRect();
            openContextMenuAction({
                position: { x: rect.left + rect.width / 2, y: rect.top + rect.height },
                items: contextMenuItems,
                metadata: { areaId: id }
            });
        }
    };

    const area = useKarmycStore(state => state.getAreaById(id));
    const space = useSpaceStore(state => state.getSpaceById(area?.spaceId || ''));

    // Si FOLLOW, on prend la couleur du space du dernier LEAD sélectionné
    let spaceColor = space?.sharedState?.color || '#0000ff';
    if (area?.role === 'FOLLOW') {
        const activeScreenId = useKarmycStore.getState().activeScreenId;
        const lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
        const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
        const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
        const leadSpaceId = leadArea?.spaceId;
        if (leadSpaceId) {
            const leadSpace = useSpaceStore.getState().spaces[leadSpaceId];
            if (leadSpace && leadSpace.sharedState?.color) {
                spaceColor = leadSpace.sharedState.color;
            }
        }
    }

    return (
        <button
            className="select-area-button"
            draggable
            onDragStart={e => {
                console.log('[AreaDragButton] NATIVE DRAGSTART', e);
                setIsDragging(true);
                handleDragStart(e);
                // Désactiver complètement le bouton pendant le drag, de manière asynchrone
                requestAnimationFrame(() => {
                    if (selectAreaButtonRef.current) {
                        selectAreaButtonRef.current.style.pointerEvents = 'none';
                        selectAreaButtonRef.current.style.opacity = '0.5';
                    }
                });
            }}
            onDragOver={e => {
                console.log('[AreaDragButton] NATIVE DRAGOVER', e);
                handleDragOver(e);
            }}
            onDrop={e => {
                if (!isDragging) {
                    console.log('[AreaDragButton] NATIVE DROP', e);
                    handleDrop(e);
                }
            }}
            onDragEnd={e => {
                console.log('[AreaDragButton] NATIVE DRAGEND', selectAreaButtonRef.current);
                setIsDragging(false);
                // Réactiver le bouton
                selectAreaButtonRef.current!.style.pointerEvents = 'auto';
                selectAreaButtonRef.current!.style.opacity = '1';
                handleDragEnd(e);
            }}
            onContextMenu={e => { e.preventDefault(); openSelectArea(e); }}
            style={{
                cursor: 'grab',
                '--space-color': spaceColor,
                pointerEvents: 'auto',
                ...style
            } as React.CSSProperties}
            ref={selectAreaButtonRef}
        />
    );
};

export default AreaDragButton;
