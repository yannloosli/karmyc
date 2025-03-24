import {
    CONTEXT_MENU_OPTION_HEIGHT,
    CONTEXT_MENU_OPTION_PADDING_LEFT,
    CONTEXT_MENU_OPTION_PADDING_RIGHT,
    DEFAULT_CONTEXT_MENU_WIDTH,
} from "../constants";
import { StyleParams } from "../utils/stylesheets";
import { cssVariables, cssZIndex } from "./cssVariables";

export default ({ css }: StyleParams) => ({
    background: css`
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: ${cssZIndex.contextMenuBackground};
		cursor: default;
		background-color: transparent;
	`,

    container: css`
		position: fixed !important;
		transform: none !important;
		background: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.gray800};
		min-width: ${DEFAULT_CONTEXT_MENU_WIDTH}px;
		max-width: 300px;
		padding: 4px 0;
		border-radius: 4px;
		z-index: ${cssZIndex.contextMenu};
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		pointer-events: auto;
	`,

    name: css`
		color: ${cssVariables.light400};
		padding: 4px ${CONTEXT_MENU_OPTION_PADDING_LEFT}px;
		line-height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
		cursor: default;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	`,


    option: css`
		padding: 0;
		padding-left: ${CONTEXT_MENU_OPTION_PADDING_LEFT}px;
		padding-right: ${CONTEXT_MENU_OPTION_PADDING_RIGHT}px;
		border: none;
		background: transparent;
		display: flex;
		align-items: center;
		width: 100%;
		height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		text-align: left;
		position: relative;
		outline: none;
		cursor: pointer;
		white-space: nowrap;

		&--eligible {
			&:hover {
				background: ${cssVariables.primary500};
			}
		}

		&--active {
			background: ${cssVariables.primary500};
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	`,

    option__icon: css`
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		margin-right: 8px;

		svg {
			fill: ${cssVariables.white500};
			width: 16px;
			height: 16px;
		}
	`,

    option__label: css`
		color: ${cssVariables.white500};
		font-size: 12px;
		font-weight: 400;
		line-height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		font-family: ${cssVariables.fontFamily};
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	`,

    option__arrowRight: css`
		width: 16px;
		height: 16px;
		position: relative;
		margin-left: 8px;

		&:before,
		&:after {
			content: "";
			position: absolute;
			top: 50%;
			left: 50%;
			width: 8px;
			height: 1px;
			background: ${cssVariables.white500};
		}

		&:before {
			transform: translate(-50%, -50%) rotate(45deg);
		}

		&:after {
			transform: translate(-50%, -50%) rotate(-45deg);
		}
	`,
});
