import React from 'react';
import { css } from '@emotion/css';

const emptyAreaMessageContainer = css`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 16px;
`;

const emptyAreaMessageText = css`
    font-size: 16px;
    color: #666;
    text-align: center;
`;

export const EmptyAreaMessage: React.FC = () => {
    return (
        <div className={"empty-area-message " + emptyAreaMessageContainer}>
            <span className={emptyAreaMessageText}>
                No area initialized
            </span>
        </div>
    );
}; 
