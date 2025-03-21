import styled from '@emotion/styled';
import React from 'react';
import { IArea } from '../types/karmyc';

/**
 * Interface définissant les propriétés du composant Area
 */
interface AreaProps {
    /** L'objet zone à afficher */
    area: IArea;
    /** Indique si la zone est actuellement sélectionnée */
    isActive?: boolean;
    /** Callback appelé lorsque la zone est sélectionnée */
    onSelect?: (area: IArea) => void;
    /** Contenu enfant à afficher dans la zone */
    children?: React.ReactNode;
}

/**
 * Interface pour les propriétés stylisées de la zone
 */
interface StyledAreaProps {
    /** L'objet zone pour le positionnement */
    area: IArea;
    /** État de sélection de la zone */
    isActive: boolean;
}

const StyledArea = styled.div<StyledAreaProps>`
  position: absolute;
  left: ${(props: StyledAreaProps) => props.area.x}px;
  top: ${(props: StyledAreaProps) => props.area.y}px;
  width: ${(props: StyledAreaProps) => props.area.width}px;
  height: ${(props: StyledAreaProps) => props.area.height}px;
  border: 2px solid ${(props: StyledAreaProps) => props.isActive ? '#3182ce' : '#cbd5e0'};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #63b3ed;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

/**
 * Composant Area représentant une zone interactive dans l'interface
 * 
 * @example
 * ```tsx
 * <Area
 *   area={{ id: '1', x: 0, y: 0, width: 100, height: 100 }}
 *   isActive={true}
 *   onSelect={(area) => console.log('Zone sélectionnée:', area)}
 * >
 *   Contenu de la zone
 * </Area>
 */
export const Area: React.FC<AreaProps> = ({
    area,
    isActive = false,
    onSelect,
    children,
}) => {
    const handleClick = () => {
        if (onSelect) {
            onSelect(area);
        }
    };

    return (
        <StyledArea
            area={area}
            isActive={isActive}
            onClick={handleClick}
        >
            {children}
        </StyledArea>
    );
}; 
