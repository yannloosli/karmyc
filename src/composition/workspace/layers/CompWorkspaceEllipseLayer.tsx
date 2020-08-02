import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { CompWorkspaceLayerBaseProps } from "~/composition/workspace/compWorkspaceTypes";
import { getLayerTransformStyle } from "~/composition/workspace/layers/layerTransformStyle";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";

type OwnProps = CompWorkspaceLayerBaseProps;
interface StateProps {
	isSelected: boolean;
	layer: CompositionLayer;
}
type Props = OwnProps & StateProps;

const CompWorkspaceEllipseLayerComponent: React.FC<Props> = (props) => {
	const { layer, map } = props;

	const nameToProperty = useLayerNameToProperty(map, props.compositionId, layer.id);
	const shouldRender = useWorkspaceLayerShouldRender(map.frameIndex, layer.index, layer.length);

	if (!shouldRender) {
		return null;
	}

	const {
		PositionX,
		PositionY,
		AnchorX,
		AnchorY,
		Scale,
		Opacity,
		Rotation,
		Fill,
		StrokeWidth,
		StrokeColor,
		InnerRadius,
		OuterRadius,
	} = nameToProperty;

	const fillColor = `rgba(${Fill.join(",")})`;
	const strokeColor = `rgba(${StrokeColor.join(",")})`;

	const maskId = `layermask:${props.layerId}`;

	if (InnerRadius >= OuterRadius) {
		return null;
	}

	const transformStyle = getLayerTransformStyle(
		PositionX,
		PositionY,
		AnchorX,
		AnchorY,
		Rotation,
		Scale,
	);

	return (
		<>
			<g
				data-layer-id={props.layerId}
				width={OuterRadius * 2}
				height={OuterRadius * 2}
				style={{
					opacity: Opacity,
					...transformStyle,
				}}
			>
				<mask id={maskId}>
					<rect
						width={OuterRadius * 2}
						height={OuterRadius * 2}
						x={-OuterRadius}
						y={-OuterRadius}
						style={{ fill: "white" }}
					/>
					<ellipse
						cx={0}
						cy={0}
						rx={InnerRadius}
						ry={InnerRadius}
						style={{
							fill: "black",
						}}
					/>
				</mask>
				<ellipse
					mask={`url(#${maskId})`}
					cx={0}
					cy={0}
					rx={OuterRadius}
					ry={OuterRadius}
					style={{
						fill: fillColor,
					}}
				/>
				<ellipse
					cx={0}
					cy={0}
					rx={OuterRadius}
					ry={OuterRadius}
					style={{
						strokeWidth: StrokeWidth,
						stroke: strokeColor,
						fillOpacity: 0,
					}}
				/>
				{InnerRadius > 0 && (
					<ellipse
						cx={0}
						cy={0}
						rx={InnerRadius}
						ry={InnerRadius}
						style={{
							strokeWidth: StrokeWidth,
							stroke: strokeColor,
							fillOpacity: 0,
						}}
					/>
				)}
			</g>
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor, compositionState, compositionSelectionState },
	{ layerId },
) => {
	const layer = compositionState.layers[layerId];
	const selection = getCompSelectionFromState(layer.compositionId, compositionSelectionState);
	return {
		layer,
		graph: layer.graphId ? nodeEditor.graphs[layer.graphId] : undefined,
		isSelected: !!selection.layers[layerId],
	};
};

export const CompWorkspaceEllipseLayer = connectActionState(mapState)(
	CompWorkspaceEllipseLayerComponent,
);
