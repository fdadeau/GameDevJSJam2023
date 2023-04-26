/** Data to preload */
const data = {
    
    // spritesheets
    "jumpL": "./images/jumpL.png",
    "jumpR": "./images/jumpR.png",
    "walkL": "./images/walkL.png",
    "walkR": "./images/walkR.png",
    "timeL": "./images/timeL.png",
    "timeR": "./images/timeR.png",
    // images
    "title": "./images/title.png",
    // musics
    "tictac": "./sounds/tictac.mp3",
    // Sounds
    "bzzt": "./sounds/bzzt.mp3",
    "victory": "./sounds/victory.mp3",
    "death": "./sounds/wilhelm.mp3",
    "timeout": "./sounds/timeout.mp3"
}

/***
 * Preload of resource files (images/sounds) 
 */
async function preload(callback) {
    let loaded = 0;
    const total = Object.keys(data).length;
    for (let i in data) {
        if (data[i].endsWith(".png") || data[i].endsWith(".jpg") || data[i].endsWith(".jpeg")) {
            data[i] = await loadImage(data[i]);
        }
        else {
            data[i] = await loadSound(data[i]);
        }
        loaded++;
        callback(loaded, total);
    }
}

function loadImage(path) {
    return new Promise(function(resolve, reject) {
        let img = new Image();
        img.onload = function() {
            resolve(this);
        }
        img.onerror = function() {
            reject(this);
        }
        img.src = path;
    });
}

function loadSound(path) {
    return new Promise(function(resolve, reject) {
        let audio = new Audio();
        audio.oncanplaythrough = function() {
            resolve(this);
        }
        audio.onerror = function() {
            reject(this);
        }
        audio.src = path;
    });    
}

export { preload, data };