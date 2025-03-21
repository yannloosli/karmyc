import React, { useEffect } from "react";
import { AreaRoot } from "~/components/area/components/AreaRoot";
import { keyboardShortcutRegistry } from "~/store/registries/keyboardShortcutRegistry";
import { setupKeyboardListeners } from "~/utils/keyboard";

export const App: React.FC = () => {
    useEffect(() => {
        // Configurer les écouteurs de clavier
        const cleanupKeyboard = setupKeyboardListeners();

        // Enregistrer le raccourci Cmd+S
        const shortcutId = keyboardShortcutRegistry.register({
            key: 'S',
            modifierKeys: ['Command'],
            name: 'Save',
            fn: () => {
                console.log("Save triggered");
                (window as any).saveActionState();
                console.log("Saved!");
            }
        });

        return () => {
            // Nettoyer les écouteurs
            cleanupKeyboard();
            // Supprimer le raccourci
            keyboardShortcutRegistry.remove(shortcutId);
        };
    }, []);

    return (
        <>
            {/* 		<NormalContextMenu />
			<CustomContextMenu /> */}
            {/* 	<Toolbar /> */}
            <AreaRoot />
            {/* <DragCompositionPreview /> */}
        </>
    );
};
