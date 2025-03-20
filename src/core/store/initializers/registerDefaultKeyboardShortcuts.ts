import { AreaType } from "../../constants";
import { keyboardShortcutRegistry } from "../registries/keyboardShortcutRegistry";

/**
 * Enregistre les raccourcis clavier par défaut pour chaque type de zone
 * Cette fonction doit être appelée lors de l'initialisation de l'application
 */
export function registerDefaultKeyboardShortcuts() {
    // Raccourcis pour l'éditeur de flux
    keyboardShortcutRegistry.registerShortcuts(AreaType.FlowEditor, [
        {
            key: "Delete",
            name: "Supprimer le nœud sélectionné",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Suppression du nœud dans l'éditeur de flux ${areaId}`);
            },
            history: true,
        },
        {
            key: "C",
            modifierKeys: ["Control"],
            name: "Copier le nœud sélectionné",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Copie du nœud dans l'éditeur de flux ${areaId}`);
            },
            history: false,
        },
        {
            key: "V",
            modifierKeys: ["Control"],
            name: "Coller le nœud",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Collage du nœud dans l'éditeur de flux ${areaId}`);
            },
            history: true,
        },
    ]);

    // Raccourcis pour la timeline
    keyboardShortcutRegistry.registerShortcuts(AreaType.Timeline, [
        {
            key: "Space",
            name: "Lecture/Pause",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Lecture/Pause dans la timeline ${areaId}`);
            },
            history: false,
        },
        {
            key: "Home",
            name: "Aller au début",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Aller au début de la timeline ${areaId}`);
            },
            history: false,
        },
        {
            key: "End",
            name: "Aller à la fin",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Aller à la fin de la timeline ${areaId}`);
            },
            history: false,
        },
    ]);

    // Raccourcis pour l'espace de travail
    keyboardShortcutRegistry.registerShortcuts(AreaType.Workspace, [
        {
            key: "F",
            name: "Ajuster à la vue",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Ajuster à la vue dans l'espace de travail ${areaId}`);
            },
            history: false,
        },
        {
            key: "0",
            modifierKeys: ["Control"],
            name: "Réinitialiser le zoom",
            fn: (areaId, params) => {
                // Cette fonction sera remplacée par la vraie implémentation
                console.log(`Réinitialiser le zoom dans l'espace de travail ${areaId}`);
            },
            history: false,
        },
    ]);

    // Ces shortcuts sont temporaires et doivent être remplacés par les vrais raccourcis
    // définis dans l'application d'origine
} 
