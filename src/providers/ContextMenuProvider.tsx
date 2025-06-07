import React from 'react';
import { ContextMenu } from '../components/ContextMenu';
import { SwitchAreaTypeContextMenu } from '../components/SwitchAreatypeContextMenu';

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
    return (
        <>
            {children}
            <ContextMenu />
            <SwitchAreaTypeContextMenu />
        </>
    );
}; 
