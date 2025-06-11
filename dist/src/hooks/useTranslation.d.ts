/**
 * Custom hook to handle translations
 * @returns A translation function that uses the t function provided in the options or returns the fallback
 */
export declare const useTranslation: () => {
    t: (key: string, fallback: string) => string;
};
/**
 * Fonction pour initialiser le système de traduction
 * @param t La fonction de traduction à utiliser
 */
export declare const initializeTranslation: (t: (key: string, fallback: string) => string) => void;
