import React, { useState, useEffect } from 'react';
import { KarmycCoreProvider } from '../core/KarmycCoreProvider';
import { IKarmycOptions } from '../core/types/karmyc';

interface KarmycNextWrapperProps {
  isClient: boolean;
  children: React.ReactNode;
  config: IKarmycOptions;
}

/**
 * Next.js-specific wrapper ensuring React hooks are used in the
 * right context and avoiding hydration errors.
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
            Loading Karmyc...
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
