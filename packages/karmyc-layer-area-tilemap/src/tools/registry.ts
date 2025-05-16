import React from 'react';

export type ToolIdentifier = {
    name: string;
    icon: React.ReactNode;
    type: string;
};

export type ToolComponent = React.ComponentType<any>;

const toolRegistry: Array<{ component: ToolComponent; identifier: ToolIdentifier }> = [];

export function registerTool(component: ToolComponent, identifier: ToolIdentifier) {
    // On évite les doublons
    const idx = toolRegistry.findIndex(t => t.identifier.name === identifier.name && t.identifier.type === identifier.type);
    if (idx !== -1) toolRegistry.splice(idx, 1);
    toolRegistry.push({ component, identifier });
}

export function getTools() {
    return toolRegistry;
} 
