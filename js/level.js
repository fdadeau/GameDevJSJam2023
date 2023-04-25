/**
 * Levels
 */

import { WIDTH, HEIGHT } from "./main.js";

import { LEVELS } from "./LEVELS.js"; 

import { Player } from "./player.js";

import { audio } from "./audio.js";       

import { Platform, SlidingWall, BlinkingPlatform } from "./CyclicEntity.js";

export class Level {

    constructor(n) {
        this.map = LEVELS[n].map;
        this.size = LEVELS[n].size;
        this.exit = LEVELS[n].exit;
        this.time = LEVELS[n].time * 1000;

        this.world = { width: this.map[0].length * this.size, height: this.map.length * this.size };
        this.background = makeBackground(LEVELS[n]);
        this.player = new Player((0.5+LEVELS[n].player.c) * this.size, LEVELS[n].player.l * this.size - 1);
        
        // initializing solid walls/plaforms
        this.platforms = LEVELS[n].obstacles.filter(e => e.type == "Platform").map(p => new Platform(p.x, p.y, p.w, p.h, p.dX, p.dY, p.cycle));
        LEVELS[n].obstacles.filter(e => e.type == "BlinkingPlatform").forEach(p => {
            this.platforms.push(new BlinkingPlatform(p.x, p.y, p.w, p.h, p.dX, p.dY, p.cycle, p.delay));
        });
        this.slidingWalls = LEVELS[n].obstacles.filter(e => e.type == "SlidingWall").map(p => new SlidingWall(p.x, p.y, p.w, p.h, p.dX, p.dY, p.cycle));
        
        // launch audio
        audio.playSound("tictac", "tic", 0.3, true);
    }

    pauseAudio() {
        audio.pause("tic");
    }
    resumeAudio() {
        audio.resume("tic");
    }

    update(dt, keys) {
        if (!this.player.isFrozen()) {
            this.time -= dt;
            this.platforms.forEach(p => p.update(dt));
            this.slidingWalls.forEach(w => w.update(dt));
        }
        if (this.time < 0) {
            this.time = 0;
            return;
        }
        this.player.update(dt, keys, this);
    } 

    render(ctx) {
        // compute background position w.r.t. the player
        let srcX = this.player.x - WIDTH / 2;
        if (srcX < 0) { 
            srcX = 0; 
        }
        else if (srcX > this.background.width - WIDTH) {
            srcX = this.background.width - WIDTH;
        }
        let srcY = this.player.y - HEIGHT / 2;
        if (srcY < 0) {
            srcY = 0;
        }
        else if (srcY > this.background.height - HEIGHT) {
            srcY = this.background.height - HEIGHT;
        }
        ctx.drawImage(this.background, srcX, srcY, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);

        // draw platforms
        this.platforms.forEach(p => p.render(ctx, srcX, srcY));
        this.slidingWalls.forEach(w => w.render(ctx, srcX, srcY));

        // determine player's position in screen
        let playerX = this.player.x - srcX;
        let playerY = this.player.y - srcY;
        this.player.render(ctx, playerX, playerY);
    }


    intersectsWith(x, y, w, h) {
        return this.whichTile(x-w, y-h) || this.whichTile(x+w, y-h) || this.whichTile(x-w,y) || this.whichTile(x+w,y);
    }
    whichTile(x, y) {
        if (x < 0 || x >= this.world.width) {
            return 1;
        }
        if (y < 0 || y >= this.world.height) {
            return 1;
        }
        let l = Math.floor(y / this.size), c = Math.floor(x / this.size);

        let xInSquare = x % this.size;
        let yInSquare = y % this.size;

        switch (this.map[l][c]) {
            case 4: 
                return (this.size - xInSquare < yInSquare) ? 4 : 0;
            case 5: 
                return (xInSquare < yInSquare) ? 5 : 0;
        }
        return (this.map[l][c]);
    }

    getPointAbove(x, y) {
        if (this.whichTile(x,y) == 4) {
            return Math.floor(y / this.size + 1) * this.size - (x % this.size) - 1;
        }
        return Math.floor(y / this.size) * this.size + (x % this.size) - 1;
    }

    isOnExit(x,y,w) {
        return x-w > this.exit.c * this.size && x+w < (this.exit.c+1)*this.size && y > this.exit.l * this.size && y <= this.size*(this.exit.l +1);
    }

}




function makeBackground(level) {
    const W = level.size * level.map[0].length;
    const H = level.size * level.map.length;
    const osc = new OffscreenCanvas(W, H);
    const ctx = osc.getContext("2d");
    // sky
    ctx.fillStyle = "#000011";
    ///ctx.fillRect(0, 0, W, H);
    // elements in the map
    ctx.fillStyle = "lightgrey";

    if (level.texts) {
        ctx.fillStyle = "lightblue";
        ctx.font = "20px arial";
        ctx.textAlign = "center";
        level.texts.forEach(t => {
            ctx.fillText(t.text, t.x, t.y);
        });
    }

    for (let l=0; l < level.map.length; l++) {
        for (let c=0; c < level.map[l].length; c++) {
            switch (level.map[l][c]) {
                case 1: 
                    ctx.fillStyle = "grey";
                    ctx.fillRect(c*level.size, l*level.size, level.size, level.size);
                    ctx.fillStyle = "lightgrey";
                    ctx.fillRect(c*level.size + 2, l*level.size + 2, level.size - 4, level.size - 4);
                    break;
                case 2: 
                    ctx.moveTo(c*level.size, l*level.size);
                    ctx.beginPath();
                    ctx.lineTo((c+1)*level.size, l*level.size);
                    ctx.lineTo(c*level.size, (l+1)*level.size);
                    ctx.lineTo(c*level.size, (l)*level.size);
                    ctx.fill();
                    break;
                case 3: 
                    ctx.moveTo(c*level.size, l*level.size);
                    ctx.beginPath();
                    ctx.lineTo((c+1)*level.size, l*level.size);
                    ctx.lineTo((c+1)*level.size, (l+1)*level.size);
                    ctx.lineTo(c*level.size, (l)*level.size);
                    ctx.fill();
                    break;
                case 4: 
                    ctx.moveTo((c+1)*level.size, l*level.size);
                    ctx.beginPath();
                    ctx.lineTo((c+1)*level.size, (l+1)*level.size);
                    ctx.lineTo((c)*level.size, (l+1)*level.size);
                    ctx.lineTo((c+1)*level.size, (l)*level.size);
                    ctx.fill();
                    break;
                case 5: 
                    ctx.moveTo((c+1)*level.size, (l+1)*level.size);
                    ctx.beginPath();
                    ctx.lineTo((c)*level.size, (l)*level.size);
                    ctx.lineTo((c)*level.size, (l+1)*level.size);
                    ctx.lineTo((c+1)*level.size, (l+1)*level.size);
                    ctx.fill();
                    break;
            }
        }
    }
    ctx.fillStyle = "#700";
    ctx.fillRect((level.exit.c) * level.size, (level.exit.l - 0.5) * level.size, level.size, level.size*1.5);
    ctx.font = "16px arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText("EXIT", (level.exit.c+0.5) * level.size, (level.exit.l-0.7) * level.size);

    return osc;
}
