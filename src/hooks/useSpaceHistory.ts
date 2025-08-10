import React, { useCallback } from 'react';
import { useSpaceStore } from '../core/spaceStore';

export interface UseSpaceHistoryOptions {
    enabled?: boolean;
    maxHistorySize?: number;
}

// Deprecated legacy hook: replaced by useEnhancedHistory in useHistory.ts
export function useSpaceHistory() {
    throw new Error('useSpaceHistory is deprecated. Use useEnhancedHistory or useActiveSpaceHistory instead.');
}
