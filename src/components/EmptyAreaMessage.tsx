import React from 'react';

export const EmptyAreaMessage: React.FC = () => {
    return (
        <div className="empty-area-message">
            <span className="empty-area-message__text">
                No area initialized
            </span>
        </div>
    );
}; 
