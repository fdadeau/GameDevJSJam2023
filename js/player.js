/** 
 * Player description  
 */

import { audio } from "./audio.js";
import { WIDTH, HEIGHT } from "./main.js";

/** Movement characteristics */
const JUMP_FORCE = 0.7;
const GRAVITY = 0.05;
const ACCELERATION = 0.02;
const MAX_SPEED = 0.4;
const MAX_FALL_SPEED = 0.8;

/** Player dimensions */
const PLAYER_W = 12, PLAYER_H = 36;

/** TIME WRAP OPTIONS */
const DELTA_T = 500;
const MAX_TIME_WRAP = 3000;
const ANIMATION_TIME = 1000;

// PLAYER STATES
const NORMAL = 0, DISAPPEARING = 1, NOT_THERE = 2, APPEARING = 3;

/** Draw hitbox */
const DEBUG = true;

export class Player {

    constructor(x, y) {
        // position
        this.x = this.lastX = x;
        this.y = this.lastY = y;
        // movement 
        this.speedX = 0;
        this.speedY = GRAVITY;
        this.onGround = 0;
        this.onPlatform = null;     
        // active
        this.active = true;
        this.dead = false;
        this.complete = false;
        // 
        this.timeWarp = 0;
        this.animation = { type: NORMAL, remaining: 0, duration: 0 };
    }

    isFrozen() {
        return this.animation.type == APPEARING || this.animation.type == DISAPPEARING;
    }


    update(dt, keys, level) {

        this.lastX = this.x;
        this.lastY = this.y;

        // if player is dead --> no more moves are possible.
        if (this.dead) {
            return;
        }

        switch (this.animation.type) {
            case NORMAL:
                if (keys.warp == 1 && this.timeWarp > 0) {
                    this.animation.type = DISAPPEARING;
                    this.animation.remaining = ANIMATION_TIME;
                    this.onPlatform = null;
                    keys.warp = 0;
                    audio.pause("tic");
                    audio.playSound("bzzt", "player", 0.7, false);
                    return;
                }
                break;
            case DISAPPEARING:
                this.animation.remaining -= dt;
                if (this.animation.remaining <= 0) {
                    this.animation.remaining = this.timeWarp;
                    this.animation.type = NOT_THERE;
                    audio.resume("tic");
                }
                return;
            case NOT_THERE:
                this.animation.remaining -= dt;
                if (this.animation.remaining <= 0) {
                    this.animation.remaining = ANIMATION_TIME;
                    this.animation.type = APPEARING;
                    this.timeWarp = 0;
                    audio.pause("tic");
                    audio.playSound("bzzt", "player", 0.7, false);
                }
                else {
                    this.timeWarp = this.animation.remaining;
                }
                return;
            case APPEARING:
                this.animation.remaining -= dt;
                if (this.animation.remaining <= 0) {
                    this.animation.type = NORMAL;
                    audio.resume("tic");
                }
                return;
        }

        if (keys.jump) {
            if (this.isOnTheGround(level) || this.onPlatform) {
                this.speedY = -JUMP_FORCE;
                this.onPlatform = null;
            }
            keys.jump = 0;
        }

        // key up on exit door
        if (keys.up && this.isOnTheGround(level) && level.isOnExit(this.x, this.y, PLAYER_W)) {
            this.complete = true;
            keys.up = 0;
            return;
        }

        // time adjustment (between 0 and max MAX_TIME_WRAP)
        if (keys.adjust != 0) {
            this.timeWarp += keys.adjust * DELTA_T;
            if (this.timeWarp < 0) {
                this.timeWarp = 0;
            }
            else if (this.timeWarp > MAX_TIME_WRAP) {
                this.timeWarp = MAX_TIME_WRAP;
            }
            keys.adjust = 0;
        }

        // horizontal movement
        if (keys.right) {
            this.speedX = this.speedX >= MAX_SPEED ? MAX_SPEED : this.speedX + ACCELERATION;
        }
        if (keys.left) {
            this.speedX = this.speedX <= -MAX_SPEED ? -MAX_SPEED : this.speedX - ACCELERATION;
        }
        // if no key is pressed, increase or decrease to reach 0 
        if (!keys.left && !keys.right) {
            if (this.speedX > 0) {
                this.speedX = this.speedX - ACCELERATION <= 0 ? 0 : this.speedX - ACCELERATION;
            }
            else if (this.speedX < 0) {
                this.speedX = this.speedX + ACCELERATION >= 0 ? 0 : this.speedX + ACCELERATION;
            }
        }

        // if flying
        if (this.speedY != 0) {
            this.updateYPosition(dt, level);
            if (this.dead) return;  // out of bounds --> dead
        }
        // moving on a platform
        if (this.onPlatform != null) {
            this.y = this.onPlatform.y;
            // check if platform has reached the ground. if so, set Y coordinate to ground level.
            let t = this.isOnTheGround(level); 
            if (t > 0) {
                this.y = t - 1;
                this.onPlatform = null;
            }
        }
        this.checkAboveCollision(level);
        if (this.dead) return;
            
        this.updateXPosition(dt, level);

        this.checkWallCollisions(level);
        if (this.dead) return;

        this.onPlatform = this.isOnPlatform(level);

        if (!this.onPlatform && this.isOnTheGround(level) == 0) {
            this.speedY += GRAVITY;
            if (this.speedY > MAX_FALL_SPEED) { this.speedY = MAX_FALL_SPEED; }
        }
        else {
            this.speedY = 0;
        }

        if (this.y > level.world.height) {
            this.dead = true;
        }
        
    }


    /**
     * Update player's X position
     * @param {Number} dt Time elapsed since last update (in ms)
     * @param {Level} level Level data 
     */
    updateXPosition(dt, level) {
        let newX = this.x + this.speedX * dt;
        
        let intersectingTile = level.intersectsWith(newX, this.y, PLAYER_W, PLAYER_H);
        if (intersectingTile == 0) {
            // if free to move horizontally
            this.x = newX;
        }
        else {
            // horizontal movement is not possible, get position next to wall depending on the direction
            if (this.speedX > 0) {
                this.x = Math.floor(this.x / level.size + 1) * level.size - PLAYER_W - 1;
            }
            else {
                this.x = Math.floor(this.x / level.size ) * level.size + PLAYER_W;
            }
            this.speedX = 0;
        }
    }
    /**
     * Update Y and X positions (in that particular order)
     * @param {Number} dt Time elapsed since last update (in ms)
     * @param {Level} level Level data
     */
    updateYPosition(dt, level) {
        // check vertical collision
        let newY = this.y + this.speedY * dt;

        // check if out of bounds --> dead
        if (newY > level.world.height) {
            this.dead = true;
            return;
        }

        // check intersection with a tile
        let intersectingTile = level.intersectsWith(this.x, newY, PLAYER_W, PLAYER_H);
        if (intersectingTile == 0) {
            this.y = newY;
        }
        else {
            if (this.speedY > 0) {  // falling
                this.y = Math.floor(this.y / level.size + 1) * level.size - 1;
            }
            else { 
                this.y = Math.floor((this.y - PLAYER_H) / level.size) * level.size + PLAYER_H + 1;
            }
        }    
    }
    /**
     * Checks if player's coordinates are on the floor.
     * @param {Level} level Level data 
     * @returns true if it's the case.
     */
    isOnTheGround(level) {
        if (level.whichTile(this.x - PLAYER_W, this.y + 1) != 0 || level.whichTile(this.x + PLAYER_W, this.y + 1) != 0) {
            return Math.floor((this.y + 1) / level.size) * level.size;
        }
        return 0;
    }

    isOnPlatform(level) {
        for (let i=0; i < level.platforms.length; i++) {
            let p = level.platforms[i];
            if (this.speedY >= 0 && p.intersects(this.x, this.y+1, this.lastX, this.lastY, PLAYER_W)) {
                return p;
            }
        }
        return null;
    };

    checkAboveCollision(level) {
        if (level.whichTile(this.x-PLAYER_W, this.y-PLAYER_H) != 0 || level.whichTile(this.x+PLAYER_W,this.y-PLAYER_H) != 0) {
            this.dead = true;
        }
    }

    collidesWalls(level, dir) {
        for (let i=0; i < level.slidingWalls.length; i++) {
            let w = level.slidingWalls[i];
            if (this.x + dir * PLAYER_W >= w.x && this.x + dir * PLAYER_W <= w.x + w.width && this.y >= w.y && this.y <= w.y + w.height) {
                return w;
            }
        }
        return false;
    }

    checkWallCollisions(level) {
        let wL = this.collidesWalls(level,-1);
        let wR = this.collidesWalls(level,1); 
        let tileOnLeft = level.whichTile(this.x - PLAYER_W, this.y) || level.whichTile(this.x - PLAYER_W, this.y-PLAYER_H) != 0;
        let tileOnRight = level.whichTile(this.x + PLAYER_W, this.y) || level.whichTile(this.x + PLAYER_W, this.y-PLAYER_H);
        if (wL && wR || wL && tileOnRight || wR && tileOnLeft) {
            this.dead = true;
        }
        else if (wL) {
            this.x = wL.x + wL.width + PLAYER_W;
            this.speedX = 0;
        }
        else if (wR) {
            this.x = wR.x - PLAYER_W;
            this.speedX = 0;
        }
    }



    render(ctx, x, y) {
        ctx.fillStyle = "#000";

        // drawing of the character
        ctx.strokeStyle = "#000";
        let scale = 1;
        if (this.animation.type == APPEARING) {
            scale = 1 - this.animation.remaining / ANIMATION_TIME;
        }
        else if (this.animation.type == DISAPPEARING) {
            scale = this.animation.remaining / ANIMATION_TIME;
        }
        if (this.animation.type != NOT_THERE) {
            ctx.strokeRect(x - PLAYER_W * scale, y - PLAYER_H * scale - (1-scale)*PLAYER_H/2, PLAYER_W*2*scale, PLAYER_H*scale);
        }
        // debug info (pressed keys)
        if (DEBUG) {
            ctx.textAlign = "left";
            ctx.font = "12px arial";
            ctx.fillText(`x=${this.x.toFixed(2)},y=${this.y.toFixed(2)},onPlatform=${this.onPlatform != null},complete=${this.complete}`, 10, 20);
        }
        // display clock/watch
        drawWatch(ctx, this.timeWarp, WIDTH - 30, 46);
    }

}

function drawWatch(ctx, timeWarp, x, y) {
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, 20, -Math.PI/2, -Math.PI/2+2*Math.PI * timeWarp / MAX_TIME_WRAP);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#00A";
    ctx.font = "12px courier";
    ctx.fillText((timeWarp/1000).toFixed(1) + "s", x, y+5);
}