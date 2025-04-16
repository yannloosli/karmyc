import styled from '@emotion/styled';
import React from 'react';
import { IArea } from '../types/area';

/**
 * Interface defining the properties of the Area component
 */
interface AreaProps {
    /** The area object to display */
    area: IArea;
    /** Indicates if the area is currently selected */
    isActive?: boolean;
    /** Callback called when the area is selected */
    onSelect?: (area: IArea) => void;
    /** Child content to display in the area */
    children?: React.ReactNode;
}

/**
 * Interface for the styled properties of the area
 */
interface StyledAreaProps {
    /** The area object for positioning */
    area: IArea;
    /** Selection state of the area */
    isActive: boolean;
}

const StyledArea = styled.div<StyledAreaProps>`
  position: absolute;
  left: ${(props: StyledAreaProps) => props.area.position.x}px;
  top: ${(props: StyledAreaProps) => props.area.position.y}px;
  width: ${(props: StyledAreaProps) => props.area.size.width}px;
  height: ${(props: StyledAreaProps) => props.area.size.height}px;
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
 * Area component representing an interactive zone in the interface
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
