import { data } from "./preload.js";

import { WIDTH, HEIGHT } from "./main.js";

import { Level } from "./level.js";

import { LEVELS } from "./LEVELS.js"; 

import { audio } from "./audio.js";

const LOADING = 0, MENU = 5, IN_GAME = 10, GAME_OVER = 20, COMPLETED = 30, TIME_OUT = 40; 

const START_LEVEL = 3;

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
        if (this.state == IN_GAME) {
            this.level.update(dt, this.keys);
            if (this.level.time <= 0) {
                this.state = TIME_OUT;
                audio.pause("tic");
                return;
            }
            if (this.level.player.dead) {
                this.state = GAME_OVER;
                audio.pause("tic");
                return true;
            }
            if (this.level.player.complete) {
                this.state = COMPLETED;
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
            }
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 20px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.fillText(this.msg, WIDTH / 2, HEIGHT * 0.7);
            return;
        }
        this.level.render(this.ctx);
        this.ctx.textAlign = "left";
        this.ctx.fillText(`keys = ${JSON.stringify(this.keys)}`, 10, 40);
        if (this.state == GAME_OVER || this.state == TIME_OUT) {
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 40px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.fillText(this.state == GAME_OVER ? "GAME OVER" : "TIME OUT", WIDTH / 2, HEIGHT * 0.4);
            this.ctx.font = "20px arial";
            this.ctx.fillText("Press R to restart level", WIDTH / 2, HEIGHT * 0.6);
        }
        else if (this.state == COMPLETED) {
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 40px arial";
            this.ctx.fillStyle = "#A00";
            this.ctx.fillText("LEVEL COMPLETE", WIDTH / 2, HEIGHT * 0.4);
            this.ctx.font = "20px arial";
            this.ctx.fillText("Press Spacebar to load next level", WIDTH / 2, HEIGHT * 0.6);
        }
        this.ctx.fillStyle = "black";
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
            }
            return;
        }
        else if ((this.state == GAME_OVER || this.state == TIME_OUT) && code == "KeyR") {
            this.reset();
        }
        else if (this.state == COMPLETED && code == "Space") {
            if (LEVELS[this.nLevel+1]) {
                this.nLevel++;
                this.reset();
            }
        }
        else if (this.state == MENU && code == "Space") {
            this.reset();
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