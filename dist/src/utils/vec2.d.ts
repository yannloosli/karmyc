type IVec2 = Vec2 | {
    x: number;
    y: number;
} | {
    left: number;
    top: number;
};
export declare class Vec2 {
    static new(vec: IVec2): Vec2;
    static new(x: number, y: number): Vec2;
    static fromEvent(e: MouseEvent): Vec2;
    static ORIGIN: Vec2;
    /**
     * Calculate the dot product of two vectors
     */
    static dot(v1: IVec2, v2: IVec2): number;
    private _x;
    private _y;
    private atOrigin;
    constructor(vec: {
        x: number;
        y: number;
    });
    constructor(x: number, y: number);
    set x(value: number);
    get x(): number;
    set y(value: number);
    get y(): number;
    add(vec: IVec2): Vec2;
    addX(x: number): Vec2;
    addY(y: number): Vec2;
    sub(vec: Vec2): Vec2;
    subX(x: number): Vec2;
    subY(y: number): Vec2;
    subXY(x: number, y: number): Vec2;
    scale(scale: number, anchor?: IVec2): Vec2;
    scaleX(scale: number, anchor?: IVec2): Vec2;
    scaleY(scale: number, anchor?: IVec2): Vec2;
    scaleXY(scaleX: number, scaleY: number, anchor?: IVec2): Vec2;
    rotate(rad: number, anchor?: IVec2): Vec2;
    multiplyMat2(mat2: any, anchor?: IVec2): Vec2;
    copy(): Vec2;
    /**
     * Linear interpolation
     *
     * A `t` value of `0` is this vector, 1 is `vec`
     */
    lerp(vec: IVec2, t: number): Vec2;
    round(): Vec2;
    apply(fn: (vec: Vec2) => IVec2): Vec2;
    length(): number;
    eq(vec: IVec2): boolean;
    private toJSON;
}
declare global {
    class Vec2 {
        static new(vec: {
            x: number;
            y: number;
        } | {
            left: number;
            top: number;
        }): Vec2;
        static new(x: number, y: number): Vec2;
        static fromEvent(e: {
            clientX: number;
            clientY: number;
        }): Vec2;
        static ORIGIN: Vec2;
        static dot(v1: IVec2, v2: IVec2): number;
        x: number;
        y: number;
        constructor(vec: {
            x: number;
            y: number;
        });
        constructor(x: number, y: number);
        add(vec: IVec2): Vec2;
        addX(x: number): Vec2;
        addY(y: number): Vec2;
        lerp(vec: IVec2, t: number): Vec2;
        sub(vec: IVec2): Vec2;
        subX(x: number): Vec2;
        subY(y: number): Vec2;
        subXY(x: number, y: number): Vec2;
        scale(scale: number, anchor?: IVec2): Vec2;
        scaleX(scale: number, anchor?: IVec2): Vec2;
        scaleY(scale: number, anchor?: IVec2): Vec2;
        scaleXY(scaleX: number, scaleY: number, anchor?: IVec2): Vec2;
        rotate(rad: number, anchor?: IVec2): Vec2;
        multiplyMat2(mat2: any, anchor?: IVec2): Vec2;
        copy(): Vec2;
        round(): Vec2;
        apply(fn: (vec2: Vec2) => IVec2): Vec2;
        length(): number;
        eq(vec: IVec2): boolean;
    }
}
export {};
