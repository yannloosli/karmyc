import React from "react";
import { AreaType } from "../../../constants";
import { AreaComponentProps } from "../../../types/areaTypes";

interface Props {
    component: React.ComponentType<AreaComponentProps<any>>;
    areaId: string;
    areaState: any;
    type: AreaType;
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
            return (
                <div
                    style={{
                        position: "absolute",
                        left: this.props.viewport.left,
                        top: this.props.viewport.top,
                        width: this.props.viewport.width,
                        height: this.props.viewport.height,
                        backgroundColor: "#fff5f5",
                        border: "1px solid #feb2b2",
                        borderRadius: "4px",
                        padding: "16px",
                        color: "#c53030",
                    }}
                >
                    <h3>Une erreur est survenue dans la zone</h3>
                    <p>{this.state.error?.message}</p>
                </div>
            );
        }

        const Component = this.props.component;
        return (
            <Component
                id={this.props.areaId}
                state={this.props.areaState}
                type={this.props.type}
                viewport={this.props.viewport}
                Component={Component}
            />
        );
    }
} 
