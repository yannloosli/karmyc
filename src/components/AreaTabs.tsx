import React, { useState } from 'react';
import { IArea, AreaRowLayout } from '../types/areaTypes';
import { useKarmycStore } from '../store/areaStore';
import { AreaDragButton } from './handlers/AreaDragButton';
import { useSpaceStore } from '../store/spaceStore';
import { useTranslation } from '../hooks/useTranslation';

interface AreaTabsProps {
    rowId: string;
    row: AreaRowLayout;
    areas: Record<string, IArea>;
}

export const AreaTabs: React.FC<AreaTabsProps> = React.memo(({ rowId, row, areas }) => {
    const updateLayout = useKarmycStore(state => state.updateLayout);
    const setActiveArea = useKarmycStore(state => state.setActiveArea);
    const activeAreaId = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.activeAreaId);
    const { t } = useTranslation();

    // État pour l'indicateur de position de dépôt
    const [dragIndicator, setDragIndicator] = useState<{ targetId: string | null, position: 'before' | 'after' | null }>({ targetId: null, position: null });
    // État pour l'onglet en cours de glissement
    const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

    const handleTabClick = (areaId: string) => {
        const area = areas[areaId];
        if (!area) return;

        // Mettre à jour d'abord le layout pour changer l'onglet actif
        updateLayout({ id: rowId, activeTabId: areaId });
        // Puis mettre à jour l'aire active
        setActiveArea(areaId);

        // Si l'area a un espace, passer en mode MANUAL et mettre à jour l'espace actif
        if (area.spaceId) {
            useSpaceStore.getState().setActiveSpace(area.spaceId);
        }
    };

    // Drag & drop pour réorganiser les onglets
    const handleTabDragStart = (e: React.DragEvent, areaId: string) => {
        // area.isLocked est vrai ici, donc c'est un drag pour réorganiser les onglets.
        e.stopPropagation(); // Empêche AreaDragButton/useAreaDragAndDrop d'interférer.
        setDraggingTabId(areaId); // Marquer cet onglet comme étant glissé
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'tab',
            areaId,
            sourceRowId: rowId
        }));
        e.dataTransfer.setData('karmyc/tab-drag-source', 'true'); // Marqueur spécifique pour dragOver
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleTabDragOver = (e: React.DragEvent, overAreaId: string) => {
        if (e.dataTransfer.types.includes('karmyc/tab-drag-source')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetElement = e.currentTarget as HTMLElement;
            const rect = targetElement.getBoundingClientRect();
            const midPoint = rect.left + rect.width / 2;
            const position = e.clientX < midPoint ? 'before' : 'after';

            // Éviter les mises à jour d'état inutiles si l'indicateur est déjà correct
            if (dragIndicator.targetId !== overAreaId || dragIndicator.position !== position) {
                setDragIndicator({ targetId: overAreaId, position });
            }
        }
    };

    // Réinitialiser l'indicateur lorsque le drag quitte la zone des onglets
    const handleTabsContainerDragLeave = (e: React.DragEvent) => {
        // Vérifier si le relatedTarget est en dehors du conteneur des onglets
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            setDragIndicator({ targetId: null, position: null });
        }
    };

    const handleTabDrop = (e: React.DragEvent, onDropAreaId: string) => {
        try {
            const dataString = e.dataTransfer.getData('text/plain');
            if (!dataString) {
                setDragIndicator({ targetId: null, position: null });
                return;
            }
            const data = JSON.parse(dataString);

            if (data.type === 'tab' && data.sourceRowId === rowId) {
                e.preventDefault();
                e.stopPropagation();

                const sourceAreaId = data.areaId;
                const { targetId: indicatedTargetId, position: indicatedPosition } = dragIndicator;

                // Si on dépose la source sur elle-même sans intention claire de déplacement (via l'indicateur),
                // ou si l'onglet glissé n'est pas celui indiqué (par exemple, indicateur désynchronisé).
                if (sourceAreaId === onDropAreaId && indicatedTargetId !== onDropAreaId) {
                    setDragIndicator({ targetId: null, position: null });
                    return;
                }
                 // Si on dépose la source sur elle-même et que l'indicateur ne montre pas de changement de position
                if (sourceAreaId === onDropAreaId && indicatedTargetId === onDropAreaId && indicatedPosition === null) {
                    setDragIndicator({ targetId: null, position: null });
                    return;
                }

                const workingAreas = [...row.areas];
                const sourceIndex = workingAreas.findIndex(a => a.id === sourceAreaId);
                const onDropAreaOriginalIndex = row.areas.findIndex(a => a.id === onDropAreaId);

                if (sourceIndex === -1 || onDropAreaOriginalIndex === -1) {
                    setDragIndicator({ targetId: null, position: null });
                    return; // Source ou cible non trouvée (ne devrait pas arriver)
                }
                
                const [movedArea] = workingAreas.splice(sourceIndex, 1); // Enlever l'élément source

                // Calculer l'index de la cible dans le tableau modifié (après suppression de la source)
                let targetIndexInModifiedArray = onDropAreaOriginalIndex;
                if (sourceIndex < onDropAreaOriginalIndex) {
                    targetIndexInModifiedArray--; 
                }
                // Si sourceIndex === onDropAreaOriginalIndex, alors on dépose sur l'emplacement original de la source.
                // targetIndexInModifiedArray sera l'index de l'élément qui a pris la place de la source (ou sourceIndex si c'était le dernier).
                // Si on dépose sur la source elle-même, targetIndexInModifiedArray est l'index où la source *serait* si elle n'était pas déplacée.
                 if (sourceAreaId === onDropAreaId) {
                    targetIndexInModifiedArray = sourceIndex; // L'insertion se fera par rapport à la position originale de la source
                }


                let finalInsertionIndex = targetIndexInModifiedArray;
                // Utiliser l'indicateur pour déterminer si on insère avant ou après la cible
                if (indicatedTargetId === onDropAreaId && indicatedPosition === 'after') {
                     finalInsertionIndex = targetIndexInModifiedArray + 1;
                }
                // Si indicatedPosition === 'before', finalInsertionIndex est déjà correct (targetIndexInModifiedArray)
                // Si l'indicateur n'est pas sur onDropAreaId (ex: dragLeave puis drop rapide), 
                // on insère par défaut avant onDropAreaId.

                workingAreas.splice(finalInsertionIndex, 0, movedArea);
                
                updateLayout({ 
                    id: rowId, 
                    areas: workingAreas,
                    activeTabId: row.activeTabId // Préserver l'onglet actif
                });
            }
        } catch (error) {
            console.error('Error handling tab drop:', error);
        }
        // Toujours réinitialiser l'indicateur après le drop ou en cas d'erreur
        setDragIndicator({ targetId: null, position: null });
        // Et l'onglet en cours de drag, car le drag est terminé
        setDraggingTabId(null);
    };

    // Gérer la fin du drag (si le drop n'a pas eu lieu sur une cible valide ou a été annulé)
    const handleTabDragEnd = (e: React.DragEvent) => {
        setDraggingTabId(null);
        setDragIndicator({ targetId: null, position: null });
    };

        return (
        <div className="area-tabs" onDragLeave={handleTabsContainerDragLeave}>
            {row.areas.map(({ id }) => {
                const area = areas[id];

                if (!area) return null;

                const isActive = row.activeTabId === id;
                const isDragTarget = dragIndicator.targetId === id;
                const indicatorClass = isDragTarget ? `drop-indicator-${dragIndicator.position}` : '';
                const isDraggingSource = draggingTabId === id;

                return (
                    <div
                        key={id}
                        className={`area-tab ${isActive ? 'area-tab--active' : ''} ${indicatorClass} ${isDraggingSource ? 'is-dragging-source' : ''}`}
                        onClick={() => handleTabClick(id)}
                        draggable={area.isLocked} // Draggable uniquement si verrouillé pour réorganisation interne
                        onDragStart={e => area.isLocked ? handleTabDragStart(e, id) : undefined}
                        onDragOver={e => handleTabDragOver(e, id)} // Passer l'id de l'onglet survolé
                        onDrop={e => handleTabDrop(e, id)}
                        onDragEnd={handleTabDragEnd} // Ajouter le gestionnaire onDragEnd
                        data-areaid={id}
                    >
                        <span className="area-tab-label">
                            {t(`area.tab.${area.type}`, `Area: ${area.type}`)}
                        </span>
                        <button
                            className="area-tab-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTabClick(id);
                            }}
                            title={t('area.tab.close', 'Close')}
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}); 
