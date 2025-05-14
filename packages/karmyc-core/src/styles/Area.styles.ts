import { AREA_BORDER_WIDTH } from "../constants";
import { cssVariables, cssZIndex } from "./cssVariables";
import { StyleParams } from "../utils/stylesheets";

export default ({ css }: StyleParams) => ({
    area: css`
		position: absolute;
		z-index: ${cssZIndex.area.areaBase};

		&--raised {
			z-index: ${cssZIndex.area.areaRaised};
		}
	`,

    area__content: css`
		border-radius: 8px;
		background: ${cssVariables.gray500};
		position: absolute;
		z-index: 1;
		top: ${AREA_BORDER_WIDTH}px;
		left: ${AREA_BORDER_WIDTH}px;
		bottom: ${AREA_BORDER_WIDTH}px;
		right: ${AREA_BORDER_WIDTH}px;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
        
        &>div {
            width: 100%;
            height: 100%;
        }
	`,

    area__structured: css`
        border-radius: 8px;
        background: ${cssVariables.gray500};
        position: absolute;
        z-index: 1;
        top: ${AREA_BORDER_WIDTH}px;
        left: ${AREA_BORDER_WIDTH}px;
        bottom: ${AREA_BORDER_WIDTH}px;
        right: ${AREA_BORDER_WIDTH}px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `,

    area__content_container: css`
        flex: 1;
        position: relative;
        overflow: hidden;
    `,

    area__corner: css`
		width: 15px;
		height: 15px;
		position: absolute;
		z-index: 2;
		cursor: crosshair;

		&--nw {
			top: ${AREA_BORDER_WIDTH}px;
			left: ${AREA_BORDER_WIDTH}px;
		}

		&--ne {
			top: ${AREA_BORDER_WIDTH}px;
			right: ${AREA_BORDER_WIDTH}px;
		}

		&--sw {
			bottom: ${AREA_BORDER_WIDTH}px;
			left: ${AREA_BORDER_WIDTH}px;
		}

		&--se {
			bottom: ${AREA_BORDER_WIDTH}px;
			right: ${AREA_BORDER_WIDTH}px;
		}
	`,

    selectAreaButton: css`
		position: absolute;
        display: inline-block;
        width: 20px;
        height: 20px;
        border-radius: 100%;
        background: radial-gradient(circle at bottom, color-mix(in srgb, var(--space-color), white 50%), color-mix(in srgb, var(--space-color), white 20%) 10%, color-mix(in srgb, var(--space-color), black 50%) 80%, color-mix(in srgb, var(--space-color), black 90%) 100%);
        border: 2px outset var(--space-color);
        box-shadow: -1px -1px 5px 0 rgba(0, 0, 0, 0.5);
        margin: 5px;
        cursor: grab;
        right: 5px;
        z-index: 1000;
        top: 5px;

        
        &::before {
            content: "";
            position: absolute;
            top: 1%;
            left: 5%;
            border-radius: 100%;
            filter: blur(3px);
            z-index: 2; 
            height: 80%;
            width: 40%;
            background: radial-gradient(circle at 130% 130%, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0) 46%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.8) 58%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0) 100%);
            transform: translateX(131%) translateY(58%) rotateZ(168deg) rotateX(10deg);
        }

        &::after {
            display: block;
            background: radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0) 74%, white 80%, white 84%, rgba(255, 255, 255, 0) 100%);
            content: "";
            position: absolute;
            top: 5%;
            left: 10%;
            width: 80%;
            height: 80%;
            border-radius: 100%;
            filter: blur(1px);
            z-index: 2;
            transform: rotateZ(-30deg);
        }
	`,

    selectArea: css`
		position: absolute;
		top: -32px;
		left: -32px;
		padding: 36px;
		z-index: 15;
		background: transparent;
	`,

    selectArea__inner: css`
		border: 1px solid ${cssVariables.gray800};
		background: ${cssVariables.dark800};
	`,

    selectArea__item: css`
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0 24px;
		background: ${cssVariables.dark800};
		display: block;
		width: 128px;
	`,
});
