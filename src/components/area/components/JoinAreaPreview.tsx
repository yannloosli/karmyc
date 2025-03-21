import React from "react";
import styles from "~/styles/JoinAreaPreview.styles";
import { CardinalDirection } from "~/types";
import { compileStylesheet } from "../../../utils/stylesheets";
import { ArrowBoldDownIcon } from "../../icons/ArrowBoldDownIcon";

const s = compileStylesheet(styles);

interface Props {
    viewport: { left: number; top: number; width: number; height: number };
    movingInDirection: CardinalDirection;
}

export const JoinAreaPreview: React.FC<Props> = props => {
    const { viewport, movingInDirection } = props;
    const arrowWidth = Math.min(256, Math.min(viewport.width, viewport.height) * 0.75);
    return (
        <div style={{ ...viewport }} className={s("container")}>
            <div
                className={s("arrowContainer", {
                    [movingInDirection!]: true,
                })}
            >
                <div
                    className={s("arrow", { [movingInDirection!]: true })}
                    style={{ width: arrowWidth, height: arrowWidth }}
                >
                    <ArrowBoldDownIcon style={{ width: arrowWidth, height: arrowWidth }} />
                </div>
            </div>
        </div>
    );
};
