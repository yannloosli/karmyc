import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectCustomContextMenu } from "../../store/slices/contextMenuSlice";
import { cssZIndex } from "../../styles/cssVariables";
import { Rect } from "../../types/geometry";
import { compileStylesheetLabelled } from "../../utils/stylesheets";

const DEFAULT_CLOSE_MENU_BUFFER = 100;

const s = compileStylesheetLabelled(({ css }) => ({
    background: css`
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: ${cssZIndex.contextMenuBackground};
		cursor: default;
	`,

    wrapper: css`
		position: fixed;
		top: 0;
		left: 0;
		z-index: ${cssZIndex.contextMenu};

		&--center {
			transform: translate(-50%, -50%);
		}

		&--bottomLeft {
			transform: translate(0, -100%);
		}
	`,
}));

export const CustomContextMenu: React.FC = () => {
    const options = useSelector(selectCustomContextMenu);
    const [rect, setRect] = useState<Rect | null>(null);

    if (!options) {
        return null;
    }

    const center = options.alignPosition === "center";
    const bottomLeft = options.alignPosition === "bottom-left";

    const onMouseMove = (e: React.MouseEvent) => {
        const { clientX: x, clientY: y } = e;

        if (!rect) {
            return;
        }

        const closeMenuBuffer = options.closeMenuBuffer ?? DEFAULT_CLOSE_MENU_BUFFER;

        const shouldClose =
            x < rect.left - closeMenuBuffer ||
            x > rect.left + rect.width + closeMenuBuffer ||
            y < rect.top - closeMenuBuffer ||
            y > rect.top + rect.height + closeMenuBuffer;

        if (shouldClose) {
            options.close();
        }
    };

    const Component = options.component;

    return (
        <>
            <div
                className={s("background")}
                onMouseMove={onMouseMove}
                onMouseDown={() => options.close()}
            />
            <div
                className={s("wrapper", { center, bottomLeft })}
                style={{ top: options.position.y, left: options.position.x }}
            >
                <Component {...options.props} updateRect={setRect} />
            </div>
        </>
    );
};
