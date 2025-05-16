import React from 'react';
import { registerTool } from './registry';

const EraserIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="14" width="14" height="3" rx="1" fill="currentColor" /><rect x="5" y="3" width="10" height="10" rx="2" fill="currentColor" /></svg>
);

export const EraserTool: React.FC<{ active: boolean; onSelect: () => void }> = ({ active, onSelect }) => (
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
        title="Gomme"
    >
        {EraserIcon}
        <span style={{ fontSize: 11, marginTop: 2 }}>Gomme</span>
    </button>
);

registerTool(EraserTool, { name: 'eraser', icon: EraserIcon, type: 'tool' }); 
