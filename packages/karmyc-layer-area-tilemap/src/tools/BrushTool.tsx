import React from 'react';
import { registerTool } from './registry';

const BrushIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 17c0-2 2-4 4-4h2l6-6a2 2 0 1 1 2 2l-6 6v2c0 2-2 4-4 4s-4-2-4-4z" fill="currentColor" /></svg>
);

export const BrushTool: React.FC<{ active: boolean; onSelect: () => void }> = ({ active, onSelect }) => (
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
        title="Pinceau"
    >
        {BrushIcon}
        <span style={{ fontSize: 11, marginTop: 2 }}>Pinceau</span>
    </button>
);

registerTool(BrushTool, { name: 'brush', icon: BrushIcon, type: 'tool' }); 
