import React from 'react';
import { CustomContextMenu } from './CustomContextMenu';
import { NormalContextMenu } from './normal/NormalContextMenu';

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            {children}
            <CustomContextMenu />
            <NormalContextMenu />
        </>
    );
}; 
