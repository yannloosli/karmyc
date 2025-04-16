import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    size = 'large',
}) => {
    return (
        <>
            <div
                className={`loading-spinner ${size}`}
            />
            <span className="loading-text">loading...</span>
        </>
    );
}; 
