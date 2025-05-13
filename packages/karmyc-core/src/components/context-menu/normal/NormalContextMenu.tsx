import React, { useEffect, useRef, useState } from "react";
import { CONTEXT_MENU_OPTION_HEIGHT, DEFAULT_CONTEXT_MENU_WIDTH } from "../../../constants";
import { actionRegistry } from "../../../store/registries/actionRegistry";
import { useContextMenuStore } from "../../../stores/contextMenuStore";
import styles from "../../../styles/NormalContextMenu.styles";
import { ContextMenuItem } from "../../../types/contextMenu";
import { Point, Rect } from "../../../types/geometry";
import { boundingRectOfRects, isVecInRect } from "../../../utils/geometry";
import { compileStylesheet } from "../../../utils/stylesheets";

const s = compileStylesheet(styles);

const CLOSE_MENU_BUFFER = 100;
const REDUCE_STACK_BUFFER = 64;

export const NormalContextMenu: React.FC = () => {
    const isVisible = useContextMenuStore((state) => state.isVisible);
    const items = useContextMenuStore((state) => state.items);
    const position = useContextMenuStore((state) => state.position);
    const metadata = useContextMenuStore((state) => state.metadata);
    const closeContextMenu = useContextMenuStore((state) => state.closeContextMenu);

    const [rect, setRect] = useState<Rect | null>(null);
    const [reduceStackRect, setReduceStackRect] = useState<Rect | null>(null);
    const [stack, setStack] = useState<
        Array<{ position: Point; options: ContextMenuItem[]; fromIndex: number }>
    >([]);
    const mouseOverOptionListener = useRef<number | null>(null);

    useEffect(() => {
        if (!isVisible) {
            setStack([]);
            return;
        }
        let pos = { ...position };
        for (let i = 0; i < items.length; i += 1) {
            if (items[i]?.default) {
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
        const timerId = setTimeout(() => {
            const els = document.querySelectorAll("[data-option-list]");
            const rects: Rect[] = [];
            els.forEach((el) => {
                const domRect = el.getBoundingClientRect();
                if (domRect) {
                    rects.push({
                        left: domRect.left,
                        top: domRect.top,
                        width: domRect.width,
                        height: domRect.height,
                        right: domRect.right,
                        bottom: domRect.bottom,
                    });
                }
            });
            const boundingRect = boundingRectOfRects(rects);
            setRect(boundingRect);

            if (rects.length > 1) {
                const currentRect = rects[rects.length - 1];
                if (currentRect) {
                    setReduceStackRect({
                        top: currentRect.top - REDUCE_STACK_BUFFER,
                        height: currentRect.height + REDUCE_STACK_BUFFER * 2,
                        left: currentRect.left - 16,
                        width: currentRect.width + REDUCE_STACK_BUFFER + 16,
                        right: (currentRect.right ?? (currentRect.left + currentRect.width)) + REDUCE_STACK_BUFFER + 16,
                        bottom: (currentRect.bottom ?? (currentRect.top + currentRect.height)) + REDUCE_STACK_BUFFER * 2,
                    });
                } else {
                    setReduceStackRect(null);
                }
            } else {
                setReduceStackRect(null);
            }
        }, 0);

        return () => clearTimeout(timerId);
    }, [stack]);

    if (!isVisible) {
        return null;
    }

    const onMouseMove = (e: React.MouseEvent) => {
        const { clientX: x, clientY: y } = e;
        if (!rect) return;
        if (stack.length > 1 && reduceStackRect && !isVecInRect({ x, y }, reduceStackRect)) {
            setStack((prevStack) => prevStack.slice(0, prevStack.length - 1));
            return;
        }
        const shouldClose =
            x < rect.left - CLOSE_MENU_BUFFER ||
            x > rect.left + rect.width + CLOSE_MENU_BUFFER ||
            y < rect.top - CLOSE_MENU_BUFFER ||
            y > rect.top + rect.height + CLOSE_MENU_BUFFER;
        if (shouldClose) {
            closeContextMenu();
        }
    };

    const onListMouseOver = (options: ContextMenuItem[], i: number, j: number) => {
        if (i !== stack.length - 1) return;
        const itemEl = document.querySelector(`[data-option="${i}-${j}"]`);
        if (!itemEl) return;
        const itemRect = itemEl.getBoundingClientRect();
        if (!itemRect) return;
        if (mouseOverOptionListener.current) {
            window.clearTimeout(mouseOverOptionListener.current);
        }
        mouseOverOptionListener.current = window.setTimeout(() => {
            setStack((prevStack) => [
                ...prevStack.slice(0, i + 1),
                {
                    fromIndex: j,
                    options,
                    position: {
                        x: itemRect.left + itemRect.width + 2,
                        y: itemRect.top - 3,
                    },
                },
            ]);
            mouseOverOptionListener.current = null;
        }, 150);
    };

    const onListMouseOut = (i: number) => {
        if (i !== stack.length - 1) return;
        if (mouseOverOptionListener.current) {
            window.clearTimeout(mouseOverOptionListener.current);
            mouseOverOptionListener.current = null;
        }
    };

    const handleAction = (actionId: string, itemMetadata?: Record<string, any>) => {
        closeContextMenu();
        if (actionRegistry.executeAction(actionId, { ...metadata, ...itemMetadata })) {
            return;
        }
    };

    return (
        <>
            <div
                className={s("background")}
                onMouseMove={onMouseMove}
                onMouseDown={closeContextMenu}
            />
            {stack.map(({ options, position }, i) => {
                return (
                    <div
                        className={s("container")}
                        style={{ left: position.x, top: position.y }}
                        data-option-list={i}
                        key={i}
                        onMouseMove={onMouseMove}
                    >
                        {options.map((option, j) => {
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
