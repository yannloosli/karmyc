import { useArea } from '@gamesberry/karmyc-core/hooks/useArea';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import React from 'react';

interface TextNoteState {
    content: string;
}

export const TextNoteArea: React.FC<AreaComponentProps<TextNoteState>> = ({
    id,
    state,
    viewport
}) => {
    const { update } = useArea();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        update(id, {
            state: {
                content: e.target.value
            }
        });
    };

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            padding: '1rem',
            background: '#fff'
        }}>
            <textarea
                value={state.content || ''}
                onChange={handleChange}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit'
                }}
                placeholder="Write your note here..."
            />
        </div>
    );
}; 
