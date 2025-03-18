import { useCallback, useEffect, useRef, useState } from "react";
import { Vec2 } from "~/core/types/math";

interface TransitionOptions {
    duration: number;
    bezier: [number, number, number, number];
}

export function useVec2TransitionState(
    initialValue: Vec2,
    options: TransitionOptions
): [Vec2, (newValue: Vec2) => void] {
    const [value, setValue] = useState(initialValue);
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const startValueRef = useRef<Vec2>();
    const targetValueRef = useRef<Vec2>();

    const animate = useCallback((timestamp: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / options.duration, 1);

        if (startValueRef.current && targetValueRef.current) {
            const x = startValueRef.current.x + (targetValueRef.current.x - startValueRef.current.x) * progress;
            const y = startValueRef.current.y + (targetValueRef.current.y - startValueRef.current.y) * progress;
            setValue(Vec2.new(x, y));
        }

        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
        }
    }, [options.duration]);

    const setTransitionValue = useCallback((newValue: Vec2) => {
        startValueRef.current = value;
        targetValueRef.current = newValue;
        startTimeRef.current = undefined;

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(animate);
    }, [value, animate]);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return [value, setTransitionValue];
} 
