import { hexToRGBAString } from "../utils/color";
import { StyleParams } from "../utils/stylesheets";
import { cssVariables, cssZIndex } from "./cssVariables";

export default ({ css, keyframes }: StyleParams) => {
    const areaToOpenContainerAnimation = keyframes`
		0% { transform: scale(0.25); opacity: .3 }
		50% { transform: scale(0.52); opacity: .8; }
		100% { transform: scale(0.5); }
	`;
    return {
        root: css`
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `,

        cursorCapture: css`
			display: none;

			&--active {
				position: absolute;
				display: block;
				top: 0;
				left: 0;
				bottom: 0;
				right: 0;
				z-index: ${cssZIndex.area.cursorCapture};
				cursor: not-allowed;
			}
		`,

        areaToOpenContainer: css`
			z-index: ${cssZIndex.area.areaToOpen};
			transform: scale(0.5);
			position: fixed;
			opacity: 0.8;
			animation: ${areaToOpenContainerAnimation} 0.3s;
			cursor: grabbing;
			pointer-events: all;
			user-select: none;
			touch-action: none;

			& > * {
				pointer-events: all;
			}
		`,

        areaToOpenTargetOverlay: css`
			z-index: ${cssZIndex.area.areaToOpenTarget};
			position: absolute;
			background: ${hexToRGBAString(cssVariables.primary700, 0.07)};
			border-radius: 8px;
			opacity: 1;
			overflow: hidden;
			pointer-events: all;
			cursor: copy;
			transition: background-color 0.2s ease;
			user-select: none;
			touch-action: none;

			&:hover, &.dragover {
				background: ${hexToRGBAString(cssVariables.primary700, 0.15)};
			}
		`,

        placement: css`
			line {
				stroke-width: 1px;
				stroke: ${hexToRGBAString(cssVariables.primary700, 0.3)};
			}

			path {
				fill: ${hexToRGBAString(cssVariables.primary700, 0.15)};
			}
		`,

        tools__bar: css`
            display: flex;
            padding-inline: 10px;
        `
    };
};
