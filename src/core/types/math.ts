export class Vec2 {
    constructor(public x: number = 0, public y: number = 0) { }

    static new(x: number = 0, y: number = 0): Vec2 {
        return new Vec2(x, y);
    }

    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    addX(x: number): Vec2 {
        return new Vec2(this.x + x, this.y);
    }

    addY(y: number): Vec2 {
        return new Vec2(this.x, this.y + y);
    }

    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    mul(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vec2 {
        return new Vec2(this.x / scalar, this.y / scalar);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vec2 {
        const len = this.length();
        if (len === 0) return new Vec2();
        return this.div(len);
    }

    dot(other: Vec2): number {
        return this.x * other.x + this.y * other.y;
    }

    lerp(other: Vec2, t: number): Vec2 {
        return new Vec2(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t
        );
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    equals(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }
}

export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export function createRect(left: number, top: number, width: number, height: number): Rect {
    return { left, top, width, height };
} 
