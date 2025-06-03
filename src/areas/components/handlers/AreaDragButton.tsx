import { useRef, useState } from "react";
import { AreaTypeValue, useKarmycStore, useContextMenuStore, TOOLBAR_HEIGHT, areaRegistry } from "../../../core";
import { useSpaceStore } from "../../../spaces/spaceStore";
import useAreaDragAndDrop from "../../hooks/useAreaDragAndDrop";
import { CopyIcon, LockIcon, LockOpenIcon, XIcon } from "lucide-react";
import { SwitchAreaTypeContextMenu } from '../../../core/ui';

interface IAreaDragButton {
    state: any;
    type: AreaTypeValue;
    id: string;
    style?: React.CSSProperties;
}

export const AreaDragButton = ({ state, type, id, style }: IAreaDragButton) => {
    const [isDragging, setIsDragging] = useState(false);
    const isLocked = useKarmycStore.getState().getAreaById(id)?.isLocked || false;

    const {
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    } = useAreaDragAndDrop({ type, id, state });

    const openCustomContextMenu = useContextMenuStore((state) => state.openCustomContextMenu);

    // Ref pour le bouton
    const selectAreaButtonRef = useRef<HTMLDivElement>(null);
    const openSelectArea = (e: React.MouseEvent) => {
        if (selectAreaButtonRef.current) {
            const rect = selectAreaButtonRef.current.getBoundingClientRect();
            openCustomContextMenu({
                targetId: id,
                position: { x: rect.left, y: rect.top },
                component: (
                    <SwitchAreaTypeContextMenu />
                )
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

    const handleDetach = (e: React.MouseEvent) => {
        e.stopPropagation();
        useKarmycStore.getState().detachArea(id);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        useKarmycStore.getState().removeArea(id);
    };

    return (
        <div
            className="select-area-button"
            draggable={!isLocked}
            onDragStart={e => {
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
                handleDragOver(e);
            }}
            onDrop={e => {
                if (!isDragging) {
                    handleDrop(e);
                }
            }}
            onDragEnd={e => {
                setIsDragging(false);
                selectAreaButtonRef.current!.style.pointerEvents = 'auto';
                selectAreaButtonRef.current!.style.opacity = '1';
                handleDragEnd(e);
            }}
            onContextMenu={e => { e.preventDefault(); openSelectArea(e); }}
            style={{
                cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab',
                '--space-color': spaceColor,
                pointerEvents: 'auto',
                height: TOOLBAR_HEIGHT + 'px',
                ...style
            } as React.CSSProperties}
            ref={selectAreaButtonRef}
        >
            <div className="select-area-button__main">
                <button
                    className="select-area-icons select-area-button__lock-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        useKarmycStore.getState().updateArea({ id, isLocked: !isLocked });
                    }}
                >
                    {isLocked ? <LockIcon /> : <LockOpenIcon />}
                </button>
                <div className="select-area-button__name">
                    {areaRegistry.getDisplayName(type)}
                </div>
            </div>
            {!isLocked && <div className="select-area-button__action-icons">
                <button
                    className="select-area-icons select-area-button__detach"
                    onClick={handleDetach}>
                    <CopyIcon />
                </button>
                <button
                    className="select-area-icons select-area-button__close"
                    onClick={handleClose}>
                    <XIcon />
                </button>
            </div>}
        </div>
    );
};

export default AreaDragButton;
