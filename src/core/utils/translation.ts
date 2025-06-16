// Système de traduction minimal, sans store ni hook

let translationFn: ((key: string, fallback: string) => string) | null = null;

/**
 * Définit la fonction de traduction à utiliser dans l'application.
 * @param fn Fonction de traduction (clé, fallback) => string
 */
export function setTranslationFunction(fn: (key: string, fallback: string) => string) {
    translationFn = fn;
}

/**
 * Fonction utilitaire pour traduire une clé, ou retourner le fallback si aucune fonction n'est définie.
 * @param key Clé de traduction
 * @param fallback Valeur par défaut si non traduit
 */
export function t(key: string, fallback: string) {
    return translationFn ? translationFn(key, fallback) : fallback;
} 
