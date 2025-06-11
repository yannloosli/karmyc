import { AreaTypeValue } from "../../types/actions";
interface IAreaDragButton {
    state: any;
    type: AreaTypeValue;
    id: string;
    style?: React.CSSProperties;
}
export declare const AreaDragButton: ({ state, type, id, style }: IAreaDragButton) => import("react/jsx-runtime").JSX.Element;
export default AreaDragButton;
