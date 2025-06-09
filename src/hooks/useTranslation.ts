import { useContext } from 'react';
import { KarmycContext } from '../providers/KarmycProvider';

/**
 * Custom hook to handle translations
 * @returns A translation function that uses the t function provided in the options or returns the fallback
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
