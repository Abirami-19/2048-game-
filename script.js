const BOARD_SIZE = 4;
let board = [];
let score = 0;
let bestScore = localStorage.getItem('2048-best') || 0;
let history = []; 
let isAntiGravity = false;
let hasWonOnce = false;
let gameActive = true;
let isAnimating = false;

// DOM Elements
const tileContainer = document.getElementById('tile-container');
const scoreEl = document.getElementById('current-score');
const bestScoreEl = document.getElementById('best-score');
const gravityToggle = document.getElementById('gravity-toggle');
const modeText = document.getElementById('mode-text');

class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.domValue = value;
        
        this.element = document.createElement('div');
        this.element.classList.add('tile', `tile-${value}`);
        if(value > 2048) this.element.classList.add('tile-super');
        this.element.innerHTML = `<div class="tile-inner">${value}</div>`;
        
        this.updatePosition();
        tileContainer.appendChild(this.element);
    }
    
    updatePosition() {
        // 16px padding + 16px gap + 72px cell size = 88px step
        this.element.style.transform = `translate(${16 + this.x * 88}px, ${16 + this.y * 88}px)`;
    }
    
    updateDOMValue() {
        if (this.domValue !== this.value) {
            this.element.classList.remove(`tile-${this.domValue}`);
            if(this.domValue > 2048) this.element.classList.remove('tile-super');
            
            this.domValue = this.value;
            this.element.classList.add(`tile-${this.value}`);
            if(this.value > 2048) this.element.classList.add('tile-super');
            
            this.element.innerHTML = `<div class="tile-inner">${this.value}</div>`;
            this.element.classList.add('tile-merged');
            
            // Remove animation class after it finishes
            setTimeout(() => this.element.classList.remove('tile-merged'), 200);
        }
    }
    
    remove() {
        this.element.remove();
    }
}

function init() {
    tileContainer.innerHTML = '';
    board = Array(4).fill(null).map(() => Array(4).fill(null));
    score = 0;
    history = [];
    hasWonOnce = false;
    gameActive = true;
    isAnimating = false;
    updateScore();
    
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('game-won-overlay').classList.add('hidden');
    
    spawnTile();
    spawnTile();
}

function spawnTile() {
    let emptyCells = [];
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(!board[r][c]) emptyCells.push({r, c});
        }
    }
    if (emptyCells.length === 0) return;
    
    let cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    let val = Math.random() < 0.9 ? 2 : 4;
    board[cell.r][cell.c] = new Tile(cell.c, cell.r, val);
}

function updateScore() {
    scoreEl.innerText = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('2048-best', bestScore);
        bestScoreEl.innerText = bestScore;
    }
}

function saveHistory() {
    let snap = [];
    for(let r=0; r<4; r++) {
        let row = [];
        for(let c=0; c<4; c++) {
            row.push(board[r][c] ? board[r][c].value : null);
        }
        snap.push(row);
    }
    history.push({ score, board: snap });
}

function undo() {
    if (history.length === 0 || isAnimating) return;
    
    let last = history.pop();
    score = last.score;
    updateScore();
    
    tileContainer.innerHTML = '';
    board = Array(4).fill(null).map(() => Array(4).fill(null));
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(last.board[r][c] !== null) {
                board[r][c] = new Tile(c, r, last.board[r][c]);
            }
        }
    }
    
    gameActive = true;
    document.getElementById('game-over-overlay').classList.add('hidden');
}

// MATRIX ROTATION UTILS
function rotateLeft(matrix) {
    let result = Array(4).fill(null).map(() => Array(4).fill(null));
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            result[3-c][r] = matrix[r][c];
        }
    }
    return result;
}

function rotateRight(matrix) {
    let result = Array(4).fill(null).map(() => Array(4).fill(null));
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            result[c][3-r] = matrix[r][c];
        }
    }
    return result;
}

let moved = false;
let scoreIncrease = 0;

function slideLeft(boardMatrix) {
    for (let r = 0; r < 4; r++) {
        let row = boardMatrix[r];
        let tiles = row.filter(t => t !== null);
        
        for (let i = 0; i < tiles.length - 1; i++) {
            if (tiles[i].value === tiles[i+1].value) {
                let mergedFrom = tiles[i+1];
                mergedFrom.isDying = true;
                
                tiles[i].value *= 2;
                tiles[i].willMergeWith = mergedFrom;
                
                scoreIncrease += tiles[i].value;
                if (tiles[i].value === 2048 && !hasWonOnce) {
                    hasWonOnce = true;
                    setTimeout(() => {
                        document.getElementById('game-won-overlay').classList.remove('hidden');
                    }, 800);
                }
                
                tiles.splice(i+1, 1);
            }
        }
        
        while(tiles.length < 4) tiles.push(null);
        
        for (let c=0; c<4; c++) {
            if (boardMatrix[r][c] !== tiles[c]) moved = true;
            boardMatrix[r][c] = tiles[c];
        }
    }
}

function move(dir) {
    if(!gameActive || isAnimating) return;
    
    let dirNorm = dir;
    if (isAntiGravity) {
        const rev = {'Up':'Down', 'Down':'Up', 'Left':'Right', 'Right':'Left'};
        dirNorm = rev[dir] || dir;
    }

    saveHistory();
    moved = false;
    scoreIncrease = 0;

    if (dirNorm === 'Left') {
        slideLeft(board);
    } else if (dirNorm === 'Right') {
        board = rotateRight(rotateRight(board));
        slideLeft(board);
        board = rotateRight(rotateRight(board));
    } else if (dirNorm === 'Up') {
        board = rotateLeft(board);
        slideLeft(board);
        board = rotateRight(board);
    } else if (dirNorm === 'Down') {
        board = rotateRight(board);
        slideLeft(board);
        board = rotateLeft(board);
    }

    if (moved) {
        isAnimating = true;
        score += scoreIncrease;
        updateScore();
        
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                let tile = board[r][c];
                if (tile) {
                    tile.x = c;
                    tile.y = r;
                    tile.updatePosition();
                    
                    if (tile.willMergeWith) {
                        let deadTile = tile.willMergeWith;
                        deadTile.x = c;
                        deadTile.y = r;
                        deadTile.updatePosition();
                        
                        let tileEl = tile;
                        setTimeout(() => {
                            tileEl.updateDOMValue();
                            deadTile.remove();
                        }, 150);
                        
                        tile.willMergeWith = null;
                    }
                }
            }
        }
        
        setTimeout(() => {
            spawnTile();
            checkGameOver();
            isAnimating = false;
        }, 150);
    } else {
        history.pop();
    }
}

function checkGameOver() {
    let emptyCells = 0;
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(!board[r][c]) emptyCells++;
        }
    }
    
    if (emptyCells > 0) return;
    
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            let val = board[r][c].value;
            if (c < 3 && board[r][c+1] && board[r][c+1].value === val) return;
            if (r < 3 && board[r+1][c] && board[r+1][c].value === val) return;
        }
    }
    
    gameActive = false;
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}


// Event Listeners
document.addEventListener('keydown', (e) => {
    // Prevent default scrolling for arrows
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) > -1) {
        e.preventDefault();
    }
    
    switch(e.key) {
        case 'ArrowUp': move('Up'); break;
        case 'ArrowDown': move('Down'); break;
        case 'ArrowLeft': move('Left'); break;
        case 'ArrowRight': move('Right'); break;
    }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: false});

document.addEventListener('touchend', e => {
    if (!gameActive) return;
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;
    
    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) {
            if (dx > 0) move('Right');
            else move('Left');
        }
    } else {
        if (Math.abs(dy) > 30) {
            if (dy > 0) move('Down');
            else move('Up');
        }
    }
});

document.querySelector('.board-container').addEventListener('touchmove', e => e.preventDefault(), {passive:false});

gravityToggle.addEventListener('change', (e) => {
    isAntiGravity = e.target.checked;
    if (isAntiGravity) {
        modeText.innerText = 'Gravity is inverted. Swiping UP will move tiles DOWN.';
    } else {
        modeText.innerText = 'Standard gravity is active. Swiping UP will move tiles UP.';
    }
});

document.getElementById('btn-restart').addEventListener('click', init);
document.getElementById('btn-try-again').addEventListener('click', init);
document.getElementById('btn-replay').addEventListener('click', init);
document.getElementById('btn-keep-playing').addEventListener('click', () => {
    document.getElementById('game-won-overlay').classList.add('hidden');
});
document.getElementById('btn-undo').addEventListener('click', undo);

window.onload = () => {
    bestScoreEl.innerText = bestScore;
    init();
};
