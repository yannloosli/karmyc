import React, { useCallback, useEffect, useState } from 'react';

import { TOOLBAR_HEIGHT } from '@gamesberry/karmyc-core/constants';
// Supprimer imports actions Redux
// import { areaSlice, finalizeAreaPlacement, updateAreaToOpenPosition } from '@gamesberry/karmyc-core/store/slices/areaSlice';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore'; // Importer store Zustand
// Importer le type AreaState
// Importer shallow pour la comparaison
import { compileStylesheetLabelled } from '@gamesberry/karmyc-core/utils/stylesheets';

// Type to uniquely identify a component
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Menu bar component registry
const menuBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Custom hook for menu bar
export const useMenuBar = (areaType: string, areaId: string) => {
    // Create a unique key for this type:id combination
    const registryKey = `${areaType}:${areaId}`;

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: { order?: number; width?: string | number } = {}
    ) => {
        const { order = 0, width } = options;

        // Clean up existing components before adding new ones
        if (!menuBarComponentRegistry[registryKey]) {
            menuBarComponentRegistry[registryKey] = [];
        } else {
            // Keep only components with different identifiers
            menuBarComponentRegistry[registryKey] = menuBarComponentRegistry[registryKey].filter(
                item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
            );
        }

        const id = Math.random().toString(36).substr(2, 9);
        menuBarComponentRegistry[registryKey].push({
            component,
            order,
            width,
            identifier
        });

        // Sort components by order
        menuBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Function to retrieve components
    const getComponents = useCallback(() => {
        return menuBarComponentRegistry[registryKey] || [];
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
};

const s = compileStylesheetLabelled(({ css }) => ({
    menuBar: css`
        display: flex;
        align-items: center;
        height: ${TOOLBAR_HEIGHT}px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e8e8e8;
        user-select: none;
        cursor: move;
        position: relative;
        transition: background-color 0.2s;

        &:hover {
            background-color: #e8e8e8;
        }

        &.dragging {
            opacity: 0.5;
            background-color: #d9d9d9;
        }
    `,
    menuBarItem: css`
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 8px;
        position: relative;
    `
}));

// MenuBar component
export const MenuBar: React.FC<{
    areaId: string;
    areaType: string;
    areaState: any;
}> = ({ areaId, areaType, areaState }) => {
    const { getComponents } = useMenuBar(areaType, areaId);
    const components = getComponents();
    // Utiliser des sélecteurs individuels pour chaque action
    const setAreaToOpen = useAreaStore(state => state.setAreaToOpen);
    const updateAreaToOpenPosition = useAreaStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacement = useAreaStore(state => state.finalizeAreaPlacement);

    // Ajouter un état local pour suivre le drag
    const [isDragging, setIsDragging] = useState(false);

    // Le updatePosition appelle directement l'action Zustand
    const updatePosition = useCallback((x: number, y: number) => {
        updateAreaToOpenPosition({ x, y });
    }, [updateAreaToOpenPosition]);

    // Effet pour les écouteurs globaux
    useEffect(() => {
        let lastUpdateTime = 0;
        const UPDATE_THRESHOLD = 16; // Environ 60fps (1000ms / 60 = 16.6ms)

        const handleGlobalDragOver = (e: DragEvent) => {
            e.preventDefault();
            // On ne stoppe pas la propagation pour permettre au drop de se produire
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Limiter le taux de mises à jour pour éviter les surcharges
            const now = performance.now();
            if (now - lastUpdateTime < UPDATE_THRESHOLD) return;

            // Si un drag est en cours, mettre à jour la position
            const store = useAreaStore.getState();
            if (store.areaToOpen && isDragging) {
                // Vérifier si la position a changé de manière significative (au moins 5px)
                const currentPos = store.areaToOpen.position;
                const dx = Math.abs(e.clientX - currentPos.x);
                const dy = Math.abs(e.clientY - currentPos.y);

                // Ne mettre à jour que si le déplacement est significatif ou si ça fait longtemps
                if (dx > 5 || dy > 5 || now - lastUpdateTime > 100) {
                    // Réduire les logs pour améliorer les performances
                    if (now - lastUpdateTime > 100) {
                        console.log('[MenuBar] MouseMove during drag - Updating position:', { x: e.clientX, y: e.clientY });
                    }
                    updatePosition(e.clientX, e.clientY);
                    lastUpdateTime = now;
                }
            }
        };

        // Ne pas capturer dragstart/dragend globalement pour éviter les conflits
        console.log('[MenuBar] Attaching simplified global listeners (mousemove, dragover)');
        window.addEventListener('dragover', handleGlobalDragOver);
        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            console.log('[MenuBar] Removing global listeners');
            window.removeEventListener('dragover', handleGlobalDragOver);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [updatePosition, isDragging]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        // Créer une image de drag invisible
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
            width: 50px;
            height: 50px;
            position: fixed;
            top: -100px;
            left: -100px;
            opacity: 0.01;
            background-color: transparent;
        `;
        document.body.appendChild(dragImage);

        const initialPosition = { x: e.clientX, y: e.clientY };
        console.log('[MenuBar] DragStart - Initial position:', initialPosition);

        // Nettoyage des états préexistants au cas où
        const store = useAreaStore.getState();
        if (store.areaToOpen) {
            console.log('[MenuBar] DragStart - Cleaning up previous areaToOpen:', store.areaToOpen);
            store.cleanupTemporaryStates();
        }

        // Initialiser l'état areaToOpen dans Zustand avec la position ABSOLUE de la souris
        setAreaToOpen({
            position: initialPosition,
            area: {
                type: areaType,
                state: { ...areaState, sourceId: areaId }
            }
        });

        // Marquer le début du drag
        setIsDragging(true);

        // Important : utiliser une classe CSS pour marquer l'élément comme étant en cours de drag
        e.currentTarget.classList.add('dragging');

        // Définir l'effet de drag
        e.dataTransfer.effectAllowed = 'move';

        // Définir les données de drag
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'menubar',
            areaType,
            areaId
        }));

        // Définir l'image de drag
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Garder l'image de drag en vie
        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 300);

        // Empêcher la propagation de l'événement
        e.stopPropagation();

    }, [areaType, areaId, areaState, setAreaToOpen]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        // Mettre à jour la position avec les coordonnées ABSOLUES
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        // Ne pas utiliser stopPropagation ici pour permettre la propagation aux parents
        // e.stopPropagation();

        console.log('[MenuBar] Drop event triggered', { x: e.clientX, y: e.clientY });

        // Annuler le timeout de nettoyage de dragEnd s'il existe
        if ((window as any).__dragEndCleanupTimeout) {
            clearTimeout((window as any).__dragEndCleanupTimeout);
            (window as any).__dragEndCleanupTimeout = null;
            console.log('[MenuBar] Cancelled dragEnd cleanup timeout');
        }

        // Vérifier que areaToOpen existe dans le store
        const store = useAreaStore.getState();
        if (!store.areaToOpen) {
            console.log('[MenuBar] Drop event - No areaToOpen found, ignoring drop');
            return;
        }

        // Mise à jour finale de la position avant finalisation
        updatePosition(e.clientX, e.clientY);

        // Appeler l'action Zustand qui contient toute la logique
        try {
            console.log('[MenuBar] Calling finalizeAreaPlacement');
            finalizeAreaPlacement();
            console.log('[MenuBar] finalizeAreaPlacement completed successfully');
        } catch (error) {
            console.error('[MenuBar] Error during finalizeAreaPlacement:', error);
            // En cas d'erreur, nettoyer manuellement
            store.cleanupTemporaryStates();
        } finally {
            // Marquer la fin du drag
            setIsDragging(false);
        }
    }, [finalizeAreaPlacement, updatePosition]);

    // Ajouter un gestionnaire onDragEnd pour les cas où le drop n'est pas capturé
    const handleDragEnd = useCallback((e: React.DragEvent) => {
        // Retirer la classe 'dragging' si elle a été ajoutée
        e.currentTarget.classList.remove('dragging');

        console.log('[MenuBar] DragEnd event on MenuBar component');

        // Augmenter le délai de nettoyage et s'assurer qu'il n'y a pas de conflit
        const timeoutId = setTimeout(() => {
            const store = useAreaStore.getState();
            if (store.areaToOpen) {
                console.log('[MenuBar] No drop event detected after dragend, cleaning up state');
                store.cleanupTemporaryStates();
            }
            // Marquer la fin du drag
            setIsDragging(false);
        }, 1000); // Augmenter à 1 seconde

        // Stocker l'ID du timeout dans une variable globale pour pouvoir l'annuler
        (window as any).__dragEndCleanupTimeout = timeoutId;

        // Ne pas stopper la propagation ici pour permettre au drop de se produire
        // e.stopPropagation();
    }, []);

    return (
        <div
            className={`${s('menuBar')} area-menu-bar`}
            style={{
                height: TOOLBAR_HEIGHT + 'px',
            }}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            {components.map((item, index) => {
                const Component = item.component;
                return (
                    <div
                        key={`${item.identifier.type}-${item.identifier.name}-${index}`}
                        className={s("menuBarItem")}
                        style={{ width: item.width }}
                    >
                        <Component
                            areaId={areaId} // Passer areaId au composant enfant
                            areaState={areaState} // Passer areaState au composant enfant
                        />
                    </div>
                );
            })}
        </div>
    );
}; 
