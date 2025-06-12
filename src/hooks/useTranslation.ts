import { create } from 'zustand';

// Interface pour le store de traduction
interface TranslationStore {
    t: ((key: string, fallback: string) => string) | null;
    setTranslationFunction: (t: (key: string, fallback: string) => string) => void;
}

// Création du store de traduction
const useTranslationStore = create<TranslationStore>((set) => ({
    t: null,
    setTranslationFunction: (t) => set({ t })
}));

/**
 * Custom hook to handle translations
 * @returns A translation function that uses the t function provided in the options or returns the fallback
 */
export const useTranslation = () => {
    const { t } = useTranslationStore();

    // Si t n'est pas initialisé, on retourne une fonction qui retourne toujours le fallback
    if (!t) {
        return { t: (_key: string, fallback: string) => fallback };
    }

    return { t };
};

/**
 * Fonction pour initialiser le système de traduction
 * @param t La fonction de traduction à utiliser
 */
export const initializeTranslation = (t: (key: string, fallback: string) => string) => {
    useTranslationStore.getState().setTranslationFunction(t);
}; 
