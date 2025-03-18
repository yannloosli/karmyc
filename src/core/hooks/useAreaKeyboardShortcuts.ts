import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AreaType } from "../constants";
import { updateArea } from "../store/slices/areaSlice";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const useAreaKeyboardShortcuts = (
  id: string,
  type: AreaType,
  viewport: Rect
) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest(`[data-areaid="${id}"]`)) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            dispatch(
              updateArea({
                id,
                changes: {
                  x: viewport.left - 1,
                },
              })
            );
            break;
          case "ArrowRight":
            e.preventDefault();
            dispatch(
              updateArea({
                id,
                changes: {
                  x: viewport.left + 1,
                },
              })
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            dispatch(
              updateArea({
                id,
                changes: {
                  y: viewport.top - 1,
                },
              })
            );
            break;
          case "ArrowDown":
            e.preventDefault();
            dispatch(
              updateArea({
                id,
                changes: {
                  y: viewport.top + 1,
                },
              })
            );
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, id, viewport]);
}; 
