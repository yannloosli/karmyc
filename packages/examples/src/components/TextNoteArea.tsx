import { useArea } from '@gamesberry/karmyc-core/hooks/useArea';
import React from 'react';
import { AreaComponentProps } from '~/types/areaTypes';

interface TextNoteState {
    content: string;
}

export const TextNoteArea: React.FC<AreaComponentProps<TextNoteState>> = ({
    id,
    state,
    viewport
}) => {
    const { updateAreaState } = useArea();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateAreaState(id, {
            content: e.target.value
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
