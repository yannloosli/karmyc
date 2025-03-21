import { DiffType } from '~/diff/diffs';
import { store } from '../store';
import { sendDiffsToSubscribers } from '../store/diffSubscription';
import { keyboardShortcutRegistry } from '../store/registries/keyboardShortcutRegistry';
import { setupKeyboardListeners } from './keyboard';

// Configurer les raccourcis clavier pour undo/redo
export const setupUndoRedoKeyboardShortcuts = (): () => void => {
    // Configurer les écouteurs de clavier
    const cleanupKeyboard = setupKeyboardListeners();

    // Enregistrer le raccourci Cmd+Z pour Undo
    keyboardShortcutRegistry.register({
        key: 'Z',
        modifierKeys: ['Command'],
        name: 'Undo',
        fn: () => {
            const state = store.getState();
            const historyState = state.history;

            if (!historyState || historyState.currentIndex <= 0) {
                console.log("Rien à annuler");
                return;
            }

            const currentItem = historyState.items[historyState.currentIndex];
            const prevIndex = historyState.currentIndex - 1;

            // Dispatch l'action pour changer l'index d'historique
            store.dispatch({
                type: 'history/setCurrentIndex',
                payload: prevIndex
            });

            // Notifier les abonnés pour adapter l'UI
            if (currentItem && currentItem.diffs) {
                // Convertir les diffs au format core
                const coreDiffs = currentItem.diffs.map((diff, index) => ({
                    id: `undo-diff-${Date.now()}-${index}`,
                    timestamp: Date.now(),
                    type: diff && diff.type !== undefined ? DiffType[diff.type] || 'generic' : 'generic',
                    changes: [],
                    metadata: { original: diff }
                }));

                // Envoyer directement les diffs
                sendDiffsToSubscribers(store.getState(), coreDiffs, 'backward');
            }
        }
    });

    // Enregistrer le raccourci Cmd+Shift+Z pour Redo
    keyboardShortcutRegistry.register({
        key: 'Z',
        modifierKeys: ['Command', 'Shift'],
        name: 'Redo',
        fn: () => {
            const state = store.getState();
            const historyState = state.history;

            if (!historyState || historyState.currentIndex >= historyState.items.length - 1) {
                console.log("Rien à refaire");
                return;
            }

            const nextIndex = historyState.currentIndex + 1;
            const nextItem = historyState.items[nextIndex];

            // Dispatch l'action pour changer l'index d'historique
            store.dispatch({
                type: 'history/setCurrentIndex',
                payload: nextIndex
            });

            // Notifier les abonnés pour adapter l'UI
            if (nextItem && nextItem.diffs) {
                // Convertir les diffs au format core
                const coreDiffs = nextItem.diffs.map((diff, index) => ({
                    id: `redo-diff-${Date.now()}-${index}`,
                    timestamp: Date.now(),
                    type: diff && diff.type !== undefined ? DiffType[diff.type] || 'generic' : 'generic',
                    changes: [],
                    metadata: { original: diff }
                }));

                // Envoyer directement les diffs
                sendDiffsToSubscribers(store.getState(), coreDiffs, 'forward');
            }
        }
    });

    // Fonction de nettoyage
    return () => {
        cleanupKeyboard();
        // Désinscrire les raccourcis au besoin
    };
}; 
