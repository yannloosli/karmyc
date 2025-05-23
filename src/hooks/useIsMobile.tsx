import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // px

export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        // Check on mount
        checkDevice();

        // Add resize listener
        window.addEventListener('resize', checkDevice);

        // Cleanup listener
        return () => {
            window.removeEventListener('resize', checkDevice);
        };
    }, []);

    return isMobile;
}; 
