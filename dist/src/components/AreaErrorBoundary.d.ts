import React from "react";
import { AreaComponentProps } from "../types/areaTypes";
interface Props {
    component: React.ComponentType<AreaComponentProps<any>>;
    areaId: string;
    areaState: any;
    type: string;
    viewport: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
}
interface State {
    hasError: boolean;
    error: Error | null;
}
export declare class AreaErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
