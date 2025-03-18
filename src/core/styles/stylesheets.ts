export type CSSProperties = {
    [key: string]: string | number | CSSProperties | undefined;
};

export type StyleDefinition = {
    [key: string]: CSSProperties;
};

export function compileStylesheet(styles: StyleDefinition) {
    return function (className: string, modifiers?: Record<string, boolean>) {
        let result = className;

        if (modifiers) {
            Object.entries(modifiers).forEach(([modifier, value]) => {
                if (value) {
                    result += ` ${className}--${modifier}`;
                }
            });
        }

        return result;
    };
} 
