
/**
 * Cyclic entities: obstacles/platforms/etc. that have a cyclic behavior
 */
class CyclicEntity {

    /**
     * Build a cyclic-entity which moves in a cycle. 
     * @param {Number} x start position (X coordinate)
     * @param {Numver} y start position (Y coordinate) 
     * @param {Number} w hitbox width
     * @param {Number} h hitbox height 
     * @param {Number} dX movement on the horizontal axis
     * @param {Number} dY movement on the vertical axis
     * @param {Number} cycleT time for a full cycle (in ms)
     */
    constructor(x,y,w,h,dX,dY,cycleT) {
        this.x = this.initX = x;
        this.y = this.initY = y;
        this.width = this.initW = w;
        this.height = this.initH = h;
        this.dX = dX;
        this.dY = dY;
        this.timer = 0;
        this.cycle = cycleT;
    }

    update(dt) {
        this.timer += dt;
        if (this.timer < 0) {
            this.timer += this.cycle;
        }
        else if (this.timer > this.cycle) {
            this.timer = this.timer % this.cycle;
        }
        let percentage = this.timer / this.cycle;
        if (percentage > 0.5) {
            percentage = 0.5 - (percentage - 0.5);
        }
        this.x = this.initX + percentage * this.dX;
        this.y = this.initY + percentage * this.dY;
    }

    intersects(x, y, w) {
        return x + w >= this.x && x - w <= this.x + this.width && y >= this.y && y <= this.y + 2*this.height;
    }

    render(ctx, srcX, srcY) {
        
    }

}

export class Platform extends CyclicEntity {
    
    constructor(x,y,w,h,dX,dY,cycleT) {
        super(x,y,w,h,dX,dY,cycleT);
    }

    render(ctx, srcX, srcY) {
        ctx.fillStyle = "#005";
        ctx.fillRect(this.x - srcX, this.y - srcY, this.width, this.height);
    }
}

export class SlidingWall extends CyclicEntity {
    
    constructor(x,y,w,h,dX,dY,cycleT) {
        super(x,y,w,h,dX,dY,cycleT);
    }

    render(ctx, srcX, srcY) {
        ctx.fillStyle = "#709";
        ctx.fillRect(this.x - srcX, this.y - srcY, this.width, this.height);
    }
}

export class BlinkingPlatform extends Platform {
    
    constructor(x,y,w,h,dX,dY,cycleT,d) {
        super(x,y,w,h,dX,dY,cycleT);
        this.timer = d;
    }

    update(dt) {
        super.update(dt);
        this.width = (this.timer > this.cycle / 2) ? 0 : this.initW;
        this.height = (this.timer > this.cycle / 2) ? 0 : this.initH;
    }

    render(ctx, srcX, srcY) {
        ctx.fillStyle = this.timer > this.cycle * 0.4 ? "#F00" : "#005";
        ctx.fillRect(this.x - srcX, this.y - srcY, this.width, this.height);
    }

}

