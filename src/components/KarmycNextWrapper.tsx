import React, { useState, useEffect } from 'react';
import { KarmycCoreProvider } from '../core/KarmycCoreProvider';
import { IKarmycOptions } from '../core/types/karmyc';

interface KarmycNextWrapperProps {
  isClient: boolean;
  children: React.ReactNode;
  config: IKarmycOptions;
}

/**
 * Wrapper spécifique pour Next.js qui s'assure que les hooks React
 * sont utilisés dans le bon contexte et évite les erreurs d'hydratation.
 */
export const KarmycNextWrapper: React.FC<KarmycNextWrapperProps> = ({ isClient, children, config }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isClient) {
      // Attendre un tick pour s'assurer que le contexte React est prêt
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isClient]);

  if (!isClient || !isReady) {
    return (
        <div style={{ 
            width: '100%', 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            color: 'white',
            fontSize: '18px'
        }}>
            Chargement de Karmyc...
        </div>
    );
}

return (
    <KarmycCoreProvider options={config}>
        {children}
    </KarmycCoreProvider>
);
}; 

export default KarmycNextWrapper; 
