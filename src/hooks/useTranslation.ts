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

    const translate = (key: string, fallback: string): string => {
        if (t) {
            return t(key, fallback);
        }
        return fallback;
    };

    return { t: translate };
};

/**
 * Fonction pour initialiser le système de traduction
 * @param t La fonction de traduction à utiliser
 */
export const initializeTranslation = (t: (key: string, fallback: string) => string) => {
    useTranslationStore.getState().setTranslationFunction(t);
}; 
