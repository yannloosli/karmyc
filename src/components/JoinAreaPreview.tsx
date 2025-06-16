import React from "react";
import { ArrowBigDown } from 'lucide-react';
import { CardinalDirection } from "../types/directions";
import { t } from '../core/utils/translation';

interface Props {
    viewport: { left: number; top: number; width: number; height: number };
    movingInDirection: CardinalDirection;
}

export const JoinAreaPreview: React.FC<Props> = props => {
    const { viewport, movingInDirection } = props;
    
    const arrowWidth = Math.min(256, Math.min(viewport.width, viewport.height) * 5);
    return (
        <div
            className="join-area-preview"
            style={{ left: viewport.left, top: viewport.top, width: viewport.width, height: viewport.height }}
        >
            <div className={`join-area-preview__arrow-container join-area-preview__arrow-container--${movingInDirection}`}>
                <div
                    className={`join-area-preview__arrow join-area-preview__arrow--${movingInDirection}`}
                    style={{ width: arrowWidth, height: arrowWidth }}
                >
                    <ArrowBigDown size={arrowWidth + 'px'} style={{ color: 'transparent' }} />
                </div>
            </div>
            <div className="join-area-preview-content">
                {t('area.join.preview', 'Join areas')}
            </div>
        </div>
    );
};
