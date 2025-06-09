import { useContext } from 'react';
import { KarmycContext } from '../providers/KarmycProvider';

/**
 * Hook personnalisé pour gérer les traductions
 * @returns Une fonction de traduction qui utilise la fonction t fournie dans les options ou retourne le fallback
 */
export const useTranslation = () => {
    const { options } = useContext(KarmycContext);

    const t = (key: string, fallback: string): string => {
        if (options?.t) {
            return options.t(key, fallback);
        }
        return fallback;
    };

    return { t };
}; 
