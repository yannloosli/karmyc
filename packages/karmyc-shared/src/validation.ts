// Validation functions for basic data structures

// Position validation
export const validatePosition = (position: { x: number; y: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (typeof position.x !== 'number') errors.push('Position X must be a number');
    if (typeof position.y !== 'number') errors.push('Position Y must be a number');
    if (isNaN(position.x)) errors.push('Position X is NaN');
    if (isNaN(position.y)) errors.push('Position Y is NaN');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Dimensions validation
export const validateDimensions = (dimensions: { width: number; height: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (dimensions.width <= 0) errors.push('Invalid width');
    if (dimensions.height <= 0) errors.push('Invalid height');

    return {
        isValid: errors.length === 0,
        errors,
    };
}; 
