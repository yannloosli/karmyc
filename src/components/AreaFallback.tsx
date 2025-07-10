import React from 'react';
import { IArea } from '../types/areaTypes';

interface AreaFallbackProps {
    area: IArea<any>;
}

/**
 * Composant de fallback pour les areas non enregistrées
 * Affiche un placeholder avec le nom de l'area
 */
export const AreaFallback: React.FC<AreaFallbackProps> = ({ area }) => {
    const displayName = area.state?.title || area.type?.replace('-area', '') || 'Unknown Area';
    
    return (
        <div 
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '2px dashed #ccc',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                fontFamily: 'monospace'
            }}
        >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                📋
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                {displayName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
                Area type: {area.type}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '10px' }}>
                This area type is not registered in the current environment.
            </div>
        </div>
    );
}; 
