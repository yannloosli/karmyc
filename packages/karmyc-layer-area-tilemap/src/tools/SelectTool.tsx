import React from 'react';
import { registerTool } from './registry';

const SelectIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="7" y="7" width="6" height="6" rx="1" fill="currentColor" /></svg>
);

export const SelectTool: React.FC<{ active: boolean; onSelect: () => void }> = ({ active, onSelect }) => (
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
        title="Sélection"
    >
        {SelectIcon}
        <span style={{ fontSize: 11, marginTop: 2 }}>Sélection</span>
    </button>
);

registerTool(SelectTool, { name: 'select', icon: SelectIcon, type: 'tool' }); 
