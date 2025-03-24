import styled from '@emotion/styled';
import React from 'react';
import { areaRegistry } from '~/area/registry';
import { Rect } from '~/types/geometry';
import { ContentArea, MenuBar, StatusBar, Toolbar } from './components';

interface StructuredAreaProps {
    id: string;
    type: string;
    state: any;
    viewport: Rect;
    isActive?: boolean;
    onSelect?: (id: string) => void;
}

const AreaContainer = styled.div<{ viewport: Rect, isActive: boolean }>`
  position: absolute;
  left: ${props => props.viewport.left}px;
  top: ${props => props.viewport.top}px;
  width: ${props => props.viewport.width}px;
  height: ${props => props.viewport.height}px;
  display: flex;
  flex-direction: column;
  border: 2px solid ${props => props.isActive ? '#3182ce' : '#cbd5e0'};
  border-radius: 0.375rem;
  overflow: hidden;
  transition: all 0.2s;
  background-color: #ffffff;
  box-shadow: ${props => props.isActive ?
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'};

  &:hover {
    border-color: #63b3ed;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const ContentContainer = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
`;

export const StructuredArea: React.FC<StructuredAreaProps> = ({
    id,
    type,
    state,
    viewport,
    isActive = false,
    onSelect
}) => {
    const handleClick = () => {
        if (onSelect) {
            onSelect(id);
        }
    };

    // Récupérer le composant enregistré pour ce type
    const Component = areaRegistry.getComponent(type);

    if (!Component) {
        console.error(`Aucun composant enregistré pour le type d'area: ${type}`);
        return null;
    }

    return (
        <AreaContainer
            viewport={viewport}
            isActive={isActive}
            onClick={handleClick}
        >
            {/* Barre de menu en haut */}
            <MenuBar areaId={id} areaState={state} areaType={type} />

            {/* Conteneur principal avec contenu et toolbar */}
            <ContentContainer>
                {/* Contenu principal */}
                <ContentArea
                    id={id}
                    state={state}
                    type={type}
                    viewport={{
                        left: 0,
                        top: 0,
                        width: viewport.width,
                        height: viewport.height
                    }}
                    Component={Component}
                />

                {/* Toolbar et emplacements (slots) */}
                <Toolbar areaId={id} areaState={state} areaType={type} />
            </ContentContainer>

            {/* Barre d'état en bas */}
            <StatusBar areaId={id} areaState={state} areaType={type} />
        </AreaContainer>
    );
}; 
