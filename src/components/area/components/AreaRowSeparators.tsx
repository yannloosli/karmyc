import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { AREA_BORDER_WIDTH, TOOLBAR_HEIGHT } from "../../../constants";
import { RootState } from "../../../store";
import { cssZIndex } from "../../../styles/cssVariables";
import { AreaRowLayout } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
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

    // Validation basique avant de continuer
    if (!row || !row.areas || row.areas.length <= 1) {
        return null;
    }

    // Vérifier que tous les viewports nécessaires sont disponibles
    const allViewportsAvailable = row.areas.every(area =>
        areaToViewport[area.id] &&
        layout[area.id] // S'assurer que la zone existe toujours dans le layout
    );

    // Si des viewports sont manquants, ne pas essayer de rendre les séparateurs
    if (!allViewportsAvailable) {
        return null;
    }

    // Créer un tableau pour collecter les séparateurs
    const separators = [];

    // Méthode améliorée : ne pas utiliser slice(1) mais calculer 
    // la position entre deux zones adjacentes
    for (let i = 0; i < row.areas.length - 1; i++) {
        const currentArea = row.areas[i];
        const nextArea = row.areas[i + 1];

        if (!currentArea || !nextArea) continue;

        // Vérifier que les deux zones existent dans le layout et ont des viewports
        if (!layout[currentArea.id] || !layout[nextArea.id] ||
            !areaToViewport[currentArea.id] || !areaToViewport[nextArea.id]) {
            continue;
        }

        const currentViewport = areaToViewport[currentArea.id];
        const nextViewport = areaToViewport[nextArea.id];

        // Déterminer l'orientation
        const horizontal = row.orientation === "horizontal";

        // Calculer la position du séparateur basée sur les deux viewports adjacents
        let separatorRect: Rect;

        if (horizontal) {
            // Pour une orientation horizontale, le séparateur est entre la fin de la zone actuelle
            // et le début de la zone suivante (verticalement)
            separatorRect = {
                left: nextViewport.left - AREA_BORDER_WIDTH,
                top: nextViewport.top + AREA_BORDER_WIDTH * 2 + TOOLBAR_HEIGHT,
                width: AREA_BORDER_WIDTH * 2,
                height: Math.max(nextViewport.height - AREA_BORDER_WIDTH * 4 - TOOLBAR_HEIGHT * 2, 20)
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
