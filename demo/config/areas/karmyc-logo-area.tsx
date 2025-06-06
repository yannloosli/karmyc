import { useKarmycStore } from "../../../src/core/data/areaStore";
import { areaRegistry } from "../../../src/core/data/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/core/actions";
import { useAreaKeyboardShortcuts } from "../../../src/core/plugins/keyboard/hooks/useAreaKeyboardShortcuts";
import { useRegisterAreaType } from "../../../src/areas/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { Link } from "lucide-react";

export const KarmycLogoArea = () => {
    const { updateArea } = useKarmycStore.getState();

    const handleLogoKarmycArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'logo-karmyc-area',
                state: areaRegistry.getInitialState('logo-karmyc-area')
            });
        }
    };

    // Define area shortcuts
    // Définir les raccourcis clavier pour logo-karmyc
    useAreaKeyboardShortcuts('logo-karmyc-area', [
        {
            key: 'L',
            modifierKeys: ['Control'],
            name: 'Toggle Logo Size',
            fn: (areaId: string) => {
                console.log(`Toggling logo size for area ${areaId}`);
                // Implémentation du changement de taille
            }
        },
        {
            key: 'H',
            name: 'Hide/Show Logo',
            fn: (areaId: string) => {
                console.log(`Toggling logo visibility for area ${areaId}`);
                // Implémentation de la visibilité
            }
        }
    ]);

    // Register area types
    useRegisterAreaType(
        'logo-karmyc-area',
        () => <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', height: '100%' }}>
            <img
                src="/assets/brand/karmyc_logo.svg"
                style={{ width: '75%' }}
            />
            <strong>
                Karmyc core Demo
            </strong>
        </div>,
        {},
        {
            displayName: 'Logo Karmyc',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.SELF,
            icon: Link
        }
    );



    // Register action handlers
    useRegisterActionHandler('area.create-logo-karmyc-area', handleLogoKarmycArea);

    return null

}
