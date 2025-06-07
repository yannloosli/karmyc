import { useEffect } from 'react';
import { useKarmycStore } from '../store/areaStore';

/**
 * This component removes the detached screen from the store when the window is closed.
 * It should be mounted in all windows, but only acts if the current screen is detached.
 */
export function DetachedWindowCleanup() {
  const activeScreenId = useKarmycStore((s) => s.activeScreenId);
  const isDetached = useKarmycStore((s) => s.screens[activeScreenId]?.isDetached);
  const removeScreen = useKarmycStore((s) => s.removeScreen);

  useEffect(() => {
    if (!isDetached) return;
    const handleUnload = () => {
      removeScreen(activeScreenId);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [activeScreenId, isDetached, removeScreen]);

  return null;
} 
