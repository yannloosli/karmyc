import React from 'react';

export const EmptyAreaMessage: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            padding: '16px'
        }}>
            <span style={{
                fontSize: '16px',
                color: '#666',
                textAlign: 'center'
            }}>
                No area initialized
            </span>
        </div>
    );
}; 
