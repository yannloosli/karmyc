import React from 'react';
import { ContextMenu } from '../ui/ContextMenu';
import { SwitchAreaTypeContextMenu } from '../ui/SwitchAreatypeContextMenu';

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
    return (
        <>
            {children}
            <ContextMenu />
            <SwitchAreaTypeContextMenu />
        </>
    );
}; 
