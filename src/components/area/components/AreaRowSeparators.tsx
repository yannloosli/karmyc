import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AREA_BORDER_WIDTH } from "../../../constants";
import { RootState } from "../../../store";
import { cssZIndex } from "../../../styles/cssVariables";
import { AreaRowLayout } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { _setAreaViewport, getAreaRootViewport } from "../../../utils/getAreaViewport";
import { compileStylesheet } from "../../../utils/stylesheets";
import { handleDragAreaResize } from "../handlers/areaDragResize";

// Styles avec couleurs de débogage visibles
const s = compileStylesheet(({ css }) => ({
    separator: css`
		position: absolute;
		z-index: ${cssZIndex.area.separator};
		cursor: ns-resize;

		&--horizontal {
			cursor: ew-resize;
		}
	`,
}));

interface OwnProps {
    row: AreaRowLayout;
    areaToViewport: MapOf<Rect>;
}

type Props = OwnProps;

export const AreaRowSeparators: React.FC<Props> = props => {
    const { row, areaToViewport } = props;
    const { layout, rootId } = useSelector((state: RootState) => state.area);
    const viewportsRef = useRef(areaToViewport);

    // Mettre à jour les viewports quand ils changent
    useEffect(() => {
        // Vérifier si des viewports sont manquants
        const missingViewports = row.areas.some(area => !areaToViewport[area.id]);

        if (missingViewports) {
            const rootViewport = getAreaRootViewport();
            if (rootViewport && layout && rootId) {
                const newMap = computeAreaToViewport(layout, rootId, rootViewport);
                if (Object.keys(newMap).length > 0) {
                    viewportsRef.current = { ...areaToViewport, ...newMap };
                    _setAreaViewport(viewportsRef.current);
                }
            }
        }
    }, [row.areas, areaToViewport, layout, rootId]);

    // Créer un tableau pour collecter les séparateurs
    const separators = [];

    // Méthode améliorée : ne pas utiliser slice(1) mais calculer 
    // la position entre deux zones adjacentes
    for (let i = 0; i < row.areas.length - 1; i++) {
        const currentArea = row.areas[i];
        const nextArea = row.areas[i + 1];

        if (!currentArea || !nextArea) continue;

        const currentViewport = areaToViewport[currentArea.id];
        const nextViewport = areaToViewport[nextArea.id];

        if (!currentViewport || !nextViewport) {
            console.warn(`Missing viewport for area separator between ${currentArea.id} and ${nextArea.id}`);
            continue;
        }

        // Déterminer l'orientation
        const horizontal = row.orientation === "horizontal";

        // Calculer la position du séparateur basée sur les deux viewports adjacents
        let separatorRect: Rect;

        if (horizontal) {
            // Pour une orientation horizontale, le séparateur est entre la fin de la zone actuelle
            // et le début de la zone suivante (verticalement)
            separatorRect = {
                left: nextViewport.left - AREA_BORDER_WIDTH,
                top: nextViewport.top + AREA_BORDER_WIDTH * 2,
                width: AREA_BORDER_WIDTH * 2,
                height: Math.max(nextViewport.height - AREA_BORDER_WIDTH * 4, 20)
            };
        } else {
            // Pour une orientation verticale, le séparateur est entre la fin de la zone actuelle
            // et le début de la zone suivante (horizontalement)
            separatorRect = {
                left: nextViewport.left + AREA_BORDER_WIDTH * 2,
                top: nextViewport.top - AREA_BORDER_WIDTH,
                width: Math.max(nextViewport.width - AREA_BORDER_WIDTH * 4, 20),
                height: AREA_BORDER_WIDTH * 2
            };
        }

        const handleMouseDown = (e: React.MouseEvent) => {
            handleDragAreaResize(e, row, horizontal, i + 1);
        };

        separators.push(
            <div
                key={`sep-${currentArea.id}-${nextArea.id}`}
                className={s("separator", { horizontal })}
                style={{
                    ...separatorRect,
                    // Styles supplémentaires pour rendre le séparateur visible
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible',
                    fontSize: '10px',
                    color: 'white'
                }}
                onMouseDown={handleMouseDown}
            />
        );
    }

    return <>{separators}</>;
};
