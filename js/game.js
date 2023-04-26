import { data } from "./preload.js";

import { WIDTH, HEIGHT } from "./main.js";

import { Level } from "./level.js";

import { LEVELS } from "./LEVELS.js"; 

import { audio } from "./audio.js";

const LOADING = 0, MENU = 5, LEVEL_SELECTION = 8, IN_GAME = 10, PAUSE = 15, GAME_OVER = 20, COMPLETED = 30, TIME_OUT = 40; 

const START_LEVEL = 6;

const DELAY = 60;
let frame = -10, df = 1, delay = DELAY, max = 50;

export class Game {

    constructor(cvs) {
        this.ctx = cvs.getContext("2d");
        this.nLevel = START_LEVEL;
        this.state = LOADING;
        this.msg = "Loading...";
    }

    reset() {
        this.level = new Level(this.nLevel);
        this.state = IN_GAME;
        this.keys = { jump: 0, up: 0, left: 0, right: 0, warp: 0, adjust: 0 };
    }

    loading(loaded, total) {
        if (loaded >= total) {
            this.state = MENU;
            this.msg = "Press spacebar to start";
            return;
        }
        this.msg = "Loading... (" + loaded + "/" + total + ")";

    }

    update(dt) {
        if (this.state == MENU) {
            delay -= dt;
            if (delay < 0) {
                frame += df;
                if (df < 0 && frame > 0 && frame < 8) {
                    frame = 0;
                }
                if (frame > max || frame < -10) {
                    df *= -1;
                }
                delay = DELAY;
            }
            return;
        }
        if (this.state == IN_GAME) {
            this.level.update(dt, this.keys);
            if (this.level.time <= 0) {
                this.state = TIME_OUT;
                audio.pause("tic");
                audio.playSound("timeout", "player", 0.7, false);
                return;
            }
            if (this.level.player.dead) {
                this.state = GAME_OVER;
                audio.pause("tic");
                audio.playSound("death", "player", 0.7, false);
                return true;
            }
            if (this.level.player.complete) {
                this.state = COMPLETED;
                audio.playSound("victory", "player", 0.7, false);
                audio.pause("tic");
            }
        }
        return true;
    }

    render() {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
        if (this.state == LOADING || this.state == MENU) {
            if (this.state == MENU) {
                this.ctx.drawImage(data["title"], 60, 100, 700, 60);
                if (frame <= 32) {
                    this.ctx.drawImage(data["timeR"], 0, (frame < 0 ? 0 : frame * 64), 64, 64, 360, HEIGHT/2, 100, 100);
                }
            }
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 20px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.fillText(this.msg, WIDTH / 2, HEIGHT * 0.8);
            return;
        }
        if (this.state == LEVEL_SELECTION) {
            this.ctx.font = "bold 40px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.fillText("LEVEL SELECTION", WIDTH / 2, HEIGHT * 0.2);
            this.ctx.font = "16px arial";

            let k=0;
            for (let i in LEVELS) {
                mkButton(this.ctx, i, LEVELS[i].desc, 150 + (k % 5) * 120, 200 + (k >= 5 ? 100 : 0), this.nLevel == Number(i));
                k++;
            }
            this.ctx.fillText("Use arrows to browse levels, and space to validate.", WIDTH / 2, HEIGHT * 0.85);
            this.ctx.fillText("Use Escape to return to title.", WIDTH / 2, HEIGHT * 0.9);
            return;
        }
        this.level.render(this.ctx);
        this.ctx.textAlign = "left";
        //this.ctx.fillText(`keys = ${JSON.stringify(this.keys)}`, 10, 40);
        if (this.state == PAUSE) {
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(WIDTH / 2 - 160, HEIGHT / 2 - 100, 320, 200);
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(WIDTH / 2 - 150, HEIGHT / 2 - 90, 300, 180);
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME PAUSED", WIDTH/2, HEIGHT/2 - 60);
            this.ctx.fillText("Press Escape again to exit", WIDTH/2, HEIGHT/2);
            this.ctx.fillText("Press Spacebar to resume", WIDTH/2, HEIGHT/2 + 50);
        }
        else if (this.state == GAME_OVER || this.state == TIME_OUT) {
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 40px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.strokeStyle = "white";
            this.ctx.fillText(this.state == GAME_OVER ? "GAME OVER" : "TIME OUT", WIDTH / 2, HEIGHT * 0.4);
            this.ctx.strokeText(this.state == GAME_OVER ? "GAME OVER" : "TIME OUT", WIDTH / 2, HEIGHT * 0.4);
            this.ctx.font = "20px arial";
            this.ctx.fillText("Press Spacebar to restart level", WIDTH / 2, HEIGHT * 0.6);
        }
        else if (this.state == COMPLETED) {
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 40px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.strokeStyle = "white";
            this.ctx.fillText("LEVEL COMPLETED", WIDTH / 2, HEIGHT * 0.4);
            this.ctx.strokeText("LEVEL COMPLETED", WIDTH / 2, HEIGHT * 0.4);
            this.ctx.font = "20px arial";
            this.ctx.fillText("Press Spacebar to load next level", WIDTH / 2, HEIGHT * 0.6);
        }
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "right";
        this.ctx.font = "16px courier";
        this.ctx.fillText("Time:", WIDTH - 40, 20);
        let t = String(this.level.time / 1000 | 0);
        this.ctx.fillText(t, WIDTH - 10, 20);
    }

    pressKey(code) {
        if (this.state == IN_GAME) {
            switch (code) {
                case "Space":
                    this.keys.jump = 1;
                    break;
                case "ArrowLeft":
                    this.keys.left = 1;
                    break;
                case "ArrowRight":
                    this.keys.right = 1;
                    break;
                case "ArrowUp":
                    this.keys.up = 1;
                    break;
                case "KeyA":
                    this.keys.adjust = -1;
                    break;
                case "KeyD":
                    this.keys.adjust = 1;
                    break;
                case "KeyS":
                    this.keys.warp = 1;
                    break;
                case "Escape":
                    audio.pause("tic");
                    this.state = PAUSE;
            }
            return;
        }
        else if ((this.state == GAME_OVER || this.state == TIME_OUT) && code == "Space") {
            this.reset();
        }
        else if (this.state == COMPLETED && code == "Space") {
            if (LEVELS[this.nLevel+1]) {
                this.nLevel++;
                this.reset();
            }
        }
        else if (this.state == MENU && code == "Space") {
            this.state = LEVEL_SELECTION;
            this.nLevel = 1;
        }
        else if (this.state == PAUSE) {
            if (code == "Space") {
                audio.resume("tic");
                this.state = IN_GAME;
            }
            else if (code == "Escape") {
                this.state = LEVEL_SELECTION;
            }
        }
        else if (this.state == LEVEL_SELECTION) {
            switch (code) {
                case "ArrowUp":
                    if (this.nLevel > 5) {
                        this.nLevel = this.nLevel - 5;
                    }
                    break;
                case "ArrowDown":
                    if (this.nLevel < 6) {
                        this.nLevel = this.nLevel + 5
                    }
                    break;
                case "ArrowLeft":
                    if (this.nLevel != 1 && this.nLevel != 6) {
                        this.nLevel = this.nLevel - 1;
                    }
                    break;
                case "ArrowRight":
                    if (this.nLevel != 5 && this.nLevel != 10) {
                        this.nLevel = this.nLevel + 1;
                    }
                    break;
                case "Space":
                    if (this.nLevel > 0 && this.nLevel <= Object.keys(LEVELS).length) {
                        this.reset();
                    }
                    break;
                case "Escape":
                    this.state = MENU;
                    break;
            }
        }
    }
    releaseKey(code) {
        if (this.state == IN_GAME) {
            switch (code) {
                case "Space":
                    this.keys.jump = 0;
                    break;
                case "ArrowLeft":
                    this.keys.left = 0;
                    break;
                case "ArrowRight":
                    this.keys.right = 0;
                    break;
                case "ArrowUp":
                    this.keys.up = 0;
                    break;
                case "KeyA":
                    if (this.keys.adjust < 0) {
                        this.keys.adjust = 0;
                    }
                    break;
                case "KeyD":
                    if (this.keys.adjust > 0) {
                        this.keys.adjust = 0;
                    }
                    break;
                case "KeyS":
                    this.keys.warp = 0;
                    break;
    
                }
            return;
        }
    }
}

function mkButton(ctx, txt, txt2, x, y, selected) {
    ctx.font = "arial 30px";
    ctx.textAlign = "center";
        
    if (selected) {
        ctx.fillStyle = "#600";
        ctx.fillRect(x - 20, y - 28, 40, 40);
    }
    ctx.fillStyle = "white";
    ctx.fillText(txt, x, y);
    ctx.fillText(txt2, x, y+40);
}