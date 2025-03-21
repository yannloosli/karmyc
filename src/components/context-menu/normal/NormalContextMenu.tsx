import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AreaType, CONTEXT_MENU_OPTION_HEIGHT, DEFAULT_CONTEXT_MENU_WIDTH } from "../../../constants";
import { updateArea } from "../../../store/slices/areaSlice";
import {
    closeContextMenu,
    selectContextMenuItems,
    selectContextMenuMetadata,
    selectContextMenuPosition,
    selectContextMenuTargetId,
    selectContextMenuVisible
} from "../../../store/slices/contextMenuSlice";
import styles from "../../../styles/NormalContextMenu.styles";
import { ContextMenuItem } from "../../../types/contextMenu";
import { Point, Rect } from "../../../types/geometry";
import { boundingRectOfRects, isVecInRect } from "../../../utils/geometry";
import { compileStylesheet } from "../../../utils/stylesheets";

const s = compileStylesheet(styles);

const CLOSE_MENU_BUFFER = 100;
const REDUCE_STACK_BUFFER = 64;

export const NormalContextMenu: React.FC = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(selectContextMenuVisible);
    const items = useSelector(selectContextMenuItems);
    const position = useSelector(selectContextMenuPosition);
    const name = useSelector(selectContextMenuTargetId);
    const metadata = useSelector(selectContextMenuMetadata);

    console.log('NormalContextMenu render:', {
        isVisible,
        position,
        items,
        name,
        metadata
    });

    const [rect, setRect] = useState<Rect | null>(null);
    const [reduceStackRect, setReduceStackRect] = useState<Rect | null>(null);
    const [stack, setStack] = useState<
        Array<{ position: Point; options: ContextMenuItem[]; fromIndex: number }>
    >([]);

    const mouseOverOptionListener = useRef<number | null>(null);

    useEffect(() => {
        console.log('Stack effect triggered:', { isVisible, items, position });
        if (!isVisible) {
            setStack([]);
            return;
        }

        let pos = { ...position };

        for (let i = 0; i < items.length; i += 1) {
            if (items[i].default) {
                pos = {
                    x: pos.x - (DEFAULT_CONTEXT_MENU_WIDTH - 40),
                    y: pos.y - 40 + CONTEXT_MENU_OPTION_HEIGHT * i,
                };
                break;
            }
        }

        setStack([{ position: pos, options: items, fromIndex: -1 }]);
    }, [isVisible, items, position]);

    useEffect(() => {
        setTimeout(() => {
            const els = document.querySelectorAll("[data-option-list]");
            console.log('Found option lists:', els.length);
            const rects: Rect[] = [];
            els.forEach((el) => {
                const domRect = el.getBoundingClientRect();
                console.log('Option list rect:', domRect);
                rects.push({
                    left: domRect.left,
                    top: domRect.top,
                    width: domRect.width,
                    height: domRect.height,
                    right: domRect.right,
                    bottom: domRect.bottom,
                });
            });
            const boundingRect = boundingRectOfRects(rects);
            console.log('Bounding rect:', boundingRect);
            setRect(boundingRect);

            if (rects.length > 1) {
                let rect = rects[rects.length - 1];
                setReduceStackRect({
                    top: rect.top - REDUCE_STACK_BUFFER,
                    height: rect.height + REDUCE_STACK_BUFFER * 2,
                    left: rect.left - 16,
                    width: rect.width + REDUCE_STACK_BUFFER + 16,
                    right: rect.right + REDUCE_STACK_BUFFER + 16,
                    bottom: rect.bottom + REDUCE_STACK_BUFFER * 2,
                });
            } else {
                setReduceStackRect(null);
            }
        });
    }, [stack]);

    if (!isVisible) {
        return null;
    }

    const onMouseMove = (e: React.MouseEvent) => {
        const { clientX: x, clientY: y } = e;
        console.log('Mouse move:', { x, y, rect });

        if (!rect) {
            console.log('No rect available for mouse move');
            return;
        }

        if (stack.length > 1 && reduceStackRect && !isVecInRect({ x, y }, reduceStackRect)) {
            console.log('Reducing stack due to mouse position');
            setStack(stack.slice(0, stack.length - 1));
            return;
        }

        const shouldClose =
            x < rect.left - CLOSE_MENU_BUFFER ||
            x > rect.left + rect.width + CLOSE_MENU_BUFFER ||
            y < rect.top - CLOSE_MENU_BUFFER ||
            y > rect.top + rect.height + CLOSE_MENU_BUFFER;

        console.log('Should close menu:', { shouldClose, x, y, rect, CLOSE_MENU_BUFFER });

        if (shouldClose) {
            dispatch(closeContextMenu());
        }
    };

    const onListMouseOver = (options: ContextMenuItem[], i: number, j: number) => {
        if (i !== stack.length - 1) {
            return;
        }

        const item = document.querySelector(`[data-option="${i}-${j}"]`);

        if (!item) {
            return;
        }

        const rect = item.getBoundingClientRect();

        mouseOverOptionListener.current = window.setTimeout(() => {
            setStack([
                ...stack.slice(0, stack.length),
                {
                    fromIndex: j,
                    options,
                    position: {
                        x: rect.left + rect.width + 2,
                        y: rect.top - 3,
                    },
                },
            ]);
        }, 150);
    };

    const onListMouseOut = (i: number) => {
        if (i !== stack.length - 1) {
            return;
        }
        window.clearTimeout(mouseOverOptionListener.current!);
    };

    const handleAction = (actionId: string, itemMetadata?: Record<string, any>) => {
        dispatch(closeContextMenu());

        switch (actionId) {
        case 'area.project':
            dispatch(updateArea({ id: metadata?.areaId, changes: { type: AreaType.Project } }));
            break;
        case 'area.timeline':
            dispatch(updateArea({ id: metadata?.areaId, changes: { type: AreaType.Timeline } }));
            break;
        case 'area.workspace':
            dispatch(updateArea({ id: metadata?.areaId, changes: { type: AreaType.Workspace } }));
            break;
        case 'area.floweditor':
            dispatch(updateArea({ id: metadata?.areaId, changes: { type: AreaType.FlowEditor } }));
            break;
        case 'area.history':
            dispatch(updateArea({ id: metadata?.areaId, changes: { type: AreaType.History } }));
            break;
        default:
            console.warn(`Action non gérée: ${actionId}`);
        }
    };

    return (
        <>
            <div
                className={s("background")}
                onMouseMove={onMouseMove}
                onMouseDown={() => dispatch(closeContextMenu())}
            />
            {stack.map(({ options, position }, i) => {
                console.log('Rendering stack item:', { i, position, options });
                return (
                    <div
                        className={s("container")}
                        style={{ left: position.x, top: position.y }}
                        data-option-list={i}
                        key={i}
                        onMouseMove={onMouseMove}
                    >
                        {i === 0 && name && (
                            <>
                                <div className={s("name")}>{name}</div>
                                <div className={s("separator")} />
                            </>
                        )}

                        {options.map((option, j) => {
                            console.log('Rendering option:', { i, j, option });
                            const Icon = option.icon;

                            if (option.children) {
                                const active = stack[i + 1]?.fromIndex === j;
                                const eligible = active || i === stack.length - 1;

                                return (
                                    <div
                                        key={j}
                                        data-option={`${i}-${j}`}
                                        className={s("option", { active, eligible })}
                                        onMouseMove={(e) => e.stopPropagation()}
                                        onMouseOver={() => onListMouseOver(option.children!, i, j)}
                                        onMouseOut={() => onListMouseOut(i)}
                                    >
                                        {Icon && (
                                            <i className={s("option__icon")}>
                                                <Icon />
                                            </i>
                                        )}
                                        <div className={s("option__label")}>{option.label}</div>
                                        {<div className={s("option__arrowRight")} />}
                                    </div>
                                );
                            }

                            return (
                                <button
                                    className={s("option", { eligible: i === stack.length - 1 })}
                                    key={j}
                                    onClick={() => handleAction(option.actionId, option.metadata)}
                                    disabled={option.disabled}
                                >
                                    {Icon && (
                                        <i className={s("option__icon")}>
                                            <Icon />
                                        </i>
                                    )}
                                    <div className={s("option__label")}>{option.label}</div>
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
};
