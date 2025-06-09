import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export const EmptyAreaMessage: React.FC = () => {
    const { t } = useTranslation();
    
    return (
        <div className="empty-area-message">
            <span className="empty-area-message__text">
                {t('area.empty.message', 'No area initialized')}
            </span>
        </div>
    );
}; 
