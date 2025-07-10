import React from "react";
import { AreaComponentProps } from "../types/areaTypes";
import { t } from '../core/utils/translation';

export interface Props {
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

export interface State {
    hasError: boolean;
    error: Error | null;
}

// Composant fonctionnel pour l'affichage de l'erreur
const ErrorDisplay: React.FC<{
    viewport: Props['viewport'];
    error: Error | null;
}> = ({ viewport, error }) => {
    
    return (
        <div
            style={{
                position: "absolute",
                left: viewport.left,
                top: viewport.top,
                width: viewport.width,
                height: viewport.height,
                backgroundColor: "#fff5f5",
                border: "1px solid #feb2b2",
                borderRadius: "4px",
                padding: "16px",
                color: "#c53030",
            }}
        >
            <h3>{t('area.error.title', 'An error occurred in the area')}</h3>
            <p>{error?.message}</p>
        </div>
    );
};

export class AreaErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Area error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorDisplay viewport={this.props.viewport} error={this.state.error} />;
        }

        const Component = this.props.component;
        return (
            <Component
                id={this.props.areaId}
                state={this.props.areaState}
                type={this.props.type}
                viewport={this.props.viewport}
            />
        );
    }
} 
