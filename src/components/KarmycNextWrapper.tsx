import React, { useEffect, useState } from 'react';
import { KarmycCoreProvider } from '../core/KarmycCoreProvider';
import { useKarmyc } from '../hooks/useKarmyc';
import { IKarmycOptions } from '../core/types/karmyc';

interface KarmycNextWrapperProps {
  children: React.ReactNode;
  options?: IKarmycOptions;
  onError?: (error: Error) => void;
}

/**
 * Wrapper spécifique pour Next.js qui s'assure que les hooks React
 * sont utilisés dans le bon contexte et évite les erreurs d'hydratation.
 */
export const KarmycNextWrapper: React.FC<KarmycNextWrapperProps> = ({
  children,
  options = {},
  onError
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialiser Karmyc seulement côté client
  useEffect(() => {
    if (isClient) {
      try {
        // Initialiser Karmyc de manière sûre
        const config = useKarmyc(options, onError);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing Karmyc:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [isClient, options, onError]);

  // Ne rien rendre pendant l'hydratation
  if (!isClient) {
    return null;
  }

  // Ne rien rendre tant que Karmyc n'est pas prêt
  if (!isReady) {
    return null;
  }

  return (
    <KarmycCoreProvider onError={onError}>
      {children}
    </KarmycCoreProvider>
  );
};

export default KarmycNextWrapper; 
