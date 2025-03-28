import { Diff, DiffType } from "./diffs";

export type DiffFactoryFn = (factory: typeof diffFactory) => Diff | Diff[];

export const diffFactory = {
    layer: (...layerIds: string[]): Diff => {
        return { type: DiffType.Layer, layerIds };
    },
    compositionView: (compositionId: string, scale: number): Diff => {
        return { type: DiffType.ModifyCompositionView, compositionId, scale };
    },
    compositionDimensions: (compositionId: string): Diff => {
        return { type: DiffType.ModifyCompositionDimensions, compositionId };
    },
    addLayer: (layerId: string): Diff => {
        return { type: DiffType.AddLayer, layerIds: [layerId] };
    },
    removeLayer: (layerId: string): Diff => {
        return { type: DiffType.RemoveLayer, layerIds: [layerId] };
    },
    modifyLayer: (layerId: string): Diff => {
        return { type: DiffType.Layer, layerIds: [layerId] };
    },
    resizeAreas: (): Diff => {
        return { type: DiffType.ResizeAreas };
    },
    frameIndex: (compositionId: string, frameIndex: number): Diff => {
        return { type: DiffType.FrameIndex, compositionId, frameIndex };
    },
    modifyProperty: (propertyId: string): Diff => {
        return { type: DiffType.ModifyProperty, propertyId };
    },
    modifyMultipleLayerProperties: (propertyIds: string[]): Diff => {
        return { type: DiffType.ModifyMultipleLayerProperties, propertyIds };
    },
    togglePropertyAnimated: (propertyId: string): Diff => {
        return { type: DiffType.TogglePropertyAnimated, propertyId };
    },
    flowNodeState: (nodeId: string): Diff => {
        return { type: DiffType.FlowNodeState, nodeId };
    },
    flowNodeExpression: (nodeId: string): Diff => {
        return { type: DiffType.FlowNodeExpression, nodeId };
    },
    addFlowNode: (nodeId: string): Diff => {
        return { type: DiffType.AddFlowNode, nodeId };
    },
    updateNodeConnection: (affectedNodeIds: string[]): Diff => {
        return { type: DiffType.UpdateNodeConnection, nodeIds: affectedNodeIds };
    },
    layerParent: (layerId: string): Diff => {
        return { type: DiffType.LayerParent, layerId };
    },
    propertyStructure: (layerId: string): Diff => {
        return { type: DiffType.PropertyStructure, layerId };
    },
    modifierOrder: (layerId: string): Diff => {
        return { type: DiffType.ModifierOrder, layerId };
    },
    compositionSelection: (compositionId: string): Diff => {
        return { type: DiffType.CompositionSelection, compositionId };
    },
    tool: (): Diff => {
        return { type: DiffType.Tool };
    },
};
