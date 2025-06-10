import * as React from 'react';

export const DocsArea: React.FC = () => {
    return (
        <iframe
            src="/docs/index.html"
            style={{
                width: '100%',
                height: '100%',
                border: 'none'
            }}
            title="Documentation"
        />
    );
}; 
