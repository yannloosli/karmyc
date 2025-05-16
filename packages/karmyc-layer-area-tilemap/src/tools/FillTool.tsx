import React from 'react';
import { registerTool } from './registry';

const FillIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2v8h8" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M4 10a6 6 0 1 0 12 0A6 6 0 0 0 4 10z" fill="currentColor" /></svg>
);

export const FillTool: React.FC<{ active: boolean; onSelect: () => void }> = ({ active, onSelect }) => (
    <button
        onClick={onSelect}
        style={{
            background: active ? '#4fd1c5' : '#222',
            color: active ? '#222' : '#fff',
            border: active ? '2px solid #4fd1c5' : '1px solid #444',
            borderRadius: 6,
            padding: 4,
            marginRight: 4,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 48,
        }}
        title="Remplir"
    >
        {FillIcon}
        <span style={{ fontSize: 11, marginTop: 2 }}>Remplir</span>
    </button>
);

registerTool(FillTool, { name: 'fill', icon: FillIcon, type: 'tool' }); 
