import React, { useContext } from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompTimePropertyColorValue } from "~/composition/timeline/property/value/CompTimePropertyColorValue";
import { CompTimePropertyNumberValue } from "~/composition/timeline/property/value/CompTimePropertyNumberValue";
import { CompositionPropertyValuesContext } from "~/shared/composition/compositionRenderValues";
import { connectActionState } from "~/state/stateUtils";
import { RGBAColor, ValueType } from "~/types";

interface OwnProps {
	propertyId: string;
}
interface StateProps {
	valueType: ValueType;
}
type Props = OwnProps & StateProps;

const CompTimePropertyValueComponent: React.FC<Props> = (props) => {
	const propertyToValue = useContext(CompositionPropertyValuesContext);

	const value = propertyToValue[props.propertyId];

	if (props.valueType === ValueType.Color) {
		return (
			<CompTimePropertyColorValue
				propertyId={props.propertyId}
				value={value.computedValue[0] as RGBAColor}
			/>
		);
	}

	if (props.valueType === ValueType.Number) {
		return (
			<CompTimePropertyNumberValue
				propertyId={props.propertyId}
				computedValue={value.computedValue[0] as number}
				rawValue={value.rawValue as number}
			/>
		);
	}

	return null;
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState: compositions },
	{ propertyId },
) => ({
	valueType: (compositions.properties[propertyId] as CompositionProperty).valueType,
});

export const CompTimePropertyValue = connectActionState(mapState)(CompTimePropertyValueComponent);
