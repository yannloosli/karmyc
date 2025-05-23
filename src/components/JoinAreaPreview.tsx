import React from "react";
import { compileStylesheet } from "../utils/stylesheets";
import { ArrowBigDown } from 'lucide-react';
import styles from "../styles/JoinAreaPreview.styles";
import { CardinalDirection } from "../types";
import { css } from '@emotion/css';

const s = compileStylesheet(styles);

interface Props {
    viewport: { left: number; top: number; width: number; height: number };
    movingInDirection: CardinalDirection;
}

const joinAreaPreviewContainer = css`
    position: absolute;
`;

export const JoinAreaPreview: React.FC<Props> = props => {
    const { viewport, movingInDirection } = props;
    const arrowWidth = Math.min(256, Math.min(viewport.width, viewport.height) * 5);
    return (
        <div
            className={"join-area-preview " + joinAreaPreviewContainer + " " + s("container")}
            style={{ left: viewport.left, top: viewport.top, width: viewport.width, height: viewport.height }}
        >
            <div
                className={s("arrowContainer", {
                    [movingInDirection!]: true,
                })}
            >
                <div
                    className={s("arrow", { [movingInDirection!]: true })}
                    style={{ width: arrowWidth, height: arrowWidth }}
                >
                    <ArrowBigDown size={arrowWidth + 'px'} style={{ color: 'transparent' }} />
                </div>
            </div>
        </div>
    );
};
