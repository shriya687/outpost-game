export default class WaterPipePuzzle {

    constructor(scene, onComplete, onClose) {
        this.scene = scene;
        this.onComplete = onComplete;
        this.onClose = onClose;

        this.objects = [];
        this.closed = false;
        this.completed = false;

        this.stage = 'PIPES';
        this.fillProgress = 0;
        this.isFilling = false;

        this.cols = 5;
        this.rows = 4;
        this.tileSize = 76;
        this.gridStartX = 248;
        this.gridStartY = 186;
        this.sourceRow = 1;
        this.targetRow = 2;

        this.grid = [];
        this.create();
    }

    addObject(object, depth = 100) {
        object.setDepth(depth);
        if (object.setScrollFactor) {
            object.setScrollFactor(0);
        }
        this.objects.push(object);
        return object;
    }

    createPipeTextures() {
        // Directions: 1=UP, 2=RIGHT, 4=DOWN, 8=LEFT
        const shapes = [
            { key: 'pipe_straight', dirs: [1, 4] },
            { key: 'pipe_corner', dirs: [1, 2] },
            { key: 'pipe_tee', dirs: [1, 2, 4] }
        ];

        const colors = [
            { suffix: '_dry', color: 0x475569, inner: 0x334155 },
            { suffix: '_wet', color: 0x38bdf8, inner: 0x0284c7 }
        ];

        const s = this.tileSize;
        const c = s / 2;

        for (const shape of shapes) {
            for (const col of colors) {
                const texKey = shape.key + col.suffix;
                if (this.scene.textures.exists(texKey)) continue;

                const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

                g.fillStyle(col.color, 1);
                g.fillCircle(c, c, 15);
                if (shape.dirs.includes(1)) g.fillRect(c - 13, 0, 26, c);
                if (shape.dirs.includes(2)) g.fillRect(c, c - 13, c, 26);
                if (shape.dirs.includes(4)) g.fillRect(c - 13, c, 26, c);
                if (shape.dirs.includes(8)) g.fillRect(0, c - 13, c, 26);

                g.fillStyle(col.inner, 1);
                g.fillCircle(c, c, 8);
                if (shape.dirs.includes(1)) g.fillRect(c - 6, 0, 12, c);
                if (shape.dirs.includes(2)) g.fillRect(c, c - 6, c, 12);
                if (shape.dirs.includes(4)) g.fillRect(c - 6, c, 12, c);
                if (shape.dirs.includes(8)) g.fillRect(0, c - 6, c, 12);

                g.generateTexture(texKey, s, s);
                g.destroy();
            }
        }
    }

    create() {
        this.createPipeTextures();

        this.addObject(
            this.scene.add.rectangle(400, 300, 800, 600, 0x020617, 0.95),
            100
        );

        this.addObject(
            this.scene.add.rectangle(400, 300, 580, 390, 0x1e293b)
                .setStrokeStyle(3, 0x64748b),
            101
        );

        this.statusText = this.addObject(
            this.scene.add.text(400, 50, 'STEP 1: ALIGN WATER PIPELINE', {
                fontSize: '24px',
                color: '#38bdf8',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            102
        );

        this.subText = this.addObject(
            this.scene.add.text(400, 84, 'Click pipes to rotate and connect H2O IN (left) to TANK (right).', {
                fontSize: '14px',
                color: '#94a3b8'
            }).setOrigin(0.5),
            102
        );

        const srcY = this.gridStartY + this.sourceRow * this.tileSize;
        this.addObject(
            this.scene.add.rectangle(160, srcY, 86, 64, 0x090d16)
                .setStrokeStyle(2, 0x38bdf8),
            102
        );
        this.addObject(
            this.scene.add.text(160, srcY, 'H2O IN\n>>>', {
                fontSize: '15px',
                color: '#38bdf8',
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        const dstY = this.gridStartY + this.targetRow * this.tileSize;
        this.outletBox = this.addObject(
            this.scene.add.rectangle(640, dstY, 86, 64, 0x090d16)
                .setStrokeStyle(2, 0x64748b),
            102
        );
        this.outletText = this.addObject(
            this.scene.add.text(640, dstY, '>>>\nTANK', {
                fontSize: '15px',
                color: '#94a3b8',
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        this.buildGrid();
        this.updateWaterFlow();
        this.createValveUI();

        this.updateListener = () => this.updatePuzzle();
        this.scene.events.on('update', this.updateListener);

        this.handleEscape = () => this.destroy();
        this.scene.input.keyboard.on('keydown-ESC', this.handleEscape);
    }

    buildGrid() {
        const pathSet = new Set();
        let r = this.sourceRow;
        let c = 0;
        const path = [{ r: r, c: c }];
        pathSet.add(r + ',' + c);

        while (c < this.cols - 1) {
            const moves = [];
            if (r > 0 && !pathSet.has((r - 1) + ',' + c)) {
                moves.push({ r: r - 1, c: c });
            }
            if (r < this.rows - 1 && !pathSet.has((r + 1) + ',' + c)) {
                moves.push({ r: r + 1, c: c });
            }
            moves.push({ r: r, c: c + 1 });

            const next = moves[Math.floor(Math.random() * moves.length)];
            r = next.r;
            c = next.c;
            path.push({ r: r, c: c });
            pathSet.add(r + ',' + c);
        }

        while (r !== this.targetRow) {
            r += r < this.targetRow ? 1 : -1;
            path.push({ r: r, c: c });
            pathSet.add(r + ',' + c);
        }

        const reqDirs = [];
        for (let row = 0; row < this.rows; row++) {
            reqDirs[row] = [];
            for (let col = 0; col < this.cols; col++) {
                reqDirs[row][col] = 0;
            }
        }

        reqDirs[this.sourceRow][0] |= 8;
        reqDirs[this.targetRow][this.cols - 1] |= 2;

        for (let i = 0; i < path.length - 1; i++) {
            const cur = path[i];
            const nxt = path[i + 1];
            if (nxt.r < cur.r) {
                reqDirs[cur.r][cur.c] |= 1;
                reqDirs[nxt.r][nxt.c] |= 4;
            }
            if (nxt.r > cur.r) {
                reqDirs[cur.r][cur.c] |= 4;
                reqDirs[nxt.r][nxt.c] |= 1;
            }
            if (nxt.c > cur.c) {
                reqDirs[cur.r][cur.c] |= 2;
                reqDirs[nxt.r][nxt.c] |= 8;
            }
            if (nxt.c < cur.c) {
                reqDirs[cur.r][cur.c] |= 8;
                reqDirs[nxt.r][nxt.c] |= 2;
            }
        }

        const types = ['pipe_straight', 'pipe_corner', 'pipe_tee'];

        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const x = this.gridStartX + col * this.tileSize;
                const y = this.gridStartY + row * this.tileSize;

                this.addObject(
                    this.scene.add.rectangle(x, y, this.tileSize - 4, this.tileSize - 4, 0x0f172a)
                        .setStrokeStyle(1, 0x334155),
                    102
                );

                const mask = reqDirs[row][col];
                let baseType = types[Math.floor(Math.random() * types.length)];

                if (mask !== 0) {
                    const bitCount = ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0) + ((mask & 8) ? 1 : 0);
                    if (bitCount === 3) {
                        baseType = 'pipe_tee';
                    } else if (mask === 5 || mask === 10) {
                        baseType = 'pipe_straight';
                    } else {
                        baseType = 'pipe_corner';
                    }
                }

                const rot = Math.floor(Math.random() * 4);

                const sprite = this.addObject(
                    this.scene.add.image(x, y, baseType + '_dry')
                        .setAngle(rot * 90)
                        .setInteractive({ useHandCursor: true }),
                    104
                );

                const cell = { row: row, col: col, baseType: baseType, rot: rot, sprite: sprite, wet: false };

                sprite.on('pointerdown', () => {
                    if (this.stage !== 'PIPES' || this.completed) return;
                    cell.rot = (cell.rot + 1) % 4;
                    this.scene.tweens.add({
                        targets: sprite,
                        angle: cell.rot * 90,
                        duration: 90
                    });
                    this.updateWaterFlow();
                });

                this.grid[row][col] = cell;
            }
        }
    }

    getOpenings(cell) {
        let base = [];
        if (cell.baseType === 'pipe_straight') base = [1, 4];
        if (cell.baseType === 'pipe_corner') base = [1, 2];
        if (cell.baseType === 'pipe_tee') base = [1, 2, 4];

        let mask = 0;
        for (let dir of base) {
            for (let i = 0; i < cell.rot; i++) {
                dir = dir === 8 ? 1 : dir << 1;
            }
            mask |= dir;
        }
        return mask;
    }

    updateWaterFlow() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c].wet = false;
            }
        }

        const queue = [];
        const startCell = this.grid[this.sourceRow][0];
        if (this.getOpenings(startCell) & 8) {
            startCell.wet = true;
            queue.push(startCell);
        }

        while (queue.length > 0) {
            const cur = queue.shift();
            const curMask = this.getOpenings(cur);

            if ((curMask & 1) && cur.row > 0) {
                const up = this.grid[cur.row - 1][cur.col];
                if (!up.wet && (this.getOpenings(up) & 4)) {up.wet = true;
queue.push(up);
}
}
if ((curMask & 2) && cur.col < this.cols - 1) {
const right = this.grid[cur.row][cur.col + 1];
if (!right.wet && (this.getOpenings(right) & 8)) {
right.wet = true;
queue.push(right);
}
}
if ((curMask & 4) && cur.row < this.rows - 1) {
const down = this.grid[cur.row + 1][cur.col];
if (!down.wet && (this.getOpenings(down) & 1)) {
down.wet = true;
queue.push(down);
}
}
if ((curMask & 8) && cur.col > 0) {
const left = this.grid[cur.row][cur.col - 1];
if (!left.wet && (this.getOpenings(left) & 2)) {
left.wet = true;
queue.push(left);
}
}
}
for (let r = 0; r < this.rows; r++) {
for (let c = 0; c < this.cols; c++) {
const cell = this.grid[r][c];
cell.sprite.setTexture(cell.baseType + (cell.wet ? '_wet' : '_dry'));
}
}
const endCell = this.grid[this.targetRow][this.cols - 1];
if (endCell.wet && (this.getOpenings(endCell) & 2)) {
this.outletBox.setStrokeStyle(3, 0x22c55e);
this.outletText.setColor('#38bdf8');
this.stage = 'VALVE';
this.statusText.setText('STEP 2: FILL RESERVE TANK');
this.statusText.setColor('#22c55e');
this.subText.setText('Pipeline connected! Hold FILL TANK to restore outpost water.');
this.showValveUI();
}
}
createValveUI() {
this.valveElements = [];
const panel = this.addObject(
this.scene.add.rectangle(400, 300, 320, 165, 0x0f172a, 0.96)
.setStrokeStyle(2, 0x38bdf8)
.setVisible(false),
115
);
const barBg = this.addObject(
this.scene.add.rectangle(400, 265, 240, 26, 0x1e293b)
.setStrokeStyle(2, 0x64748b)
.setVisible(false),
116
);
this.fillBar = this.addObject(
this.scene.add.rectangle(282, 265, 0, 20, 0x38bdf8)
.setOrigin(0, 0.5)
.setVisible(false),
117
);
const fillBtn = this.addObject(
this.scene.add.rectangle(400, 330, 190, 44, 0x0284c7)
.setStrokeStyle(2, 0xffffff)
.setInteractive({ useHandCursor: true })
.setVisible(false),
116
);
const fillBtnText = this.addObject(
this.scene.add.text(400, 330, 'HOLD TO FILL TANK', {
fontSize: '15px',
color: '#ffffff',
fontStyle: 'bold'
}).setOrigin(0.5).setVisible(false),
117
);
fillBtn.on('pointerdown', () => {
if (this.stage === 'VALVE' && !this.completed) {
this.isFilling = true;
fillBtn.setFillStyle(0x0369a1);
}
});
fillBtn.on('pointerup', () => {
this.isFilling = false;
fillBtn.setFillStyle(0x0284c7);
});
fillBtn.on('pointerout', () => {
this.isFilling = false;
fillBtn.setFillStyle(0x0284c7);
});
this.valveElements.push(panel, barBg, this.fillBar, fillBtn, fillBtnText);
}
showValveUI() {
this.valveElements.forEach(el => el.setVisible(true));
}
updatePuzzle() {
if (this.completed || this.closed) return;
if (this.stage === 'VALVE' && this.isFilling) {
this.fillProgress = Math.min(100, this.fillProgress + 1.1);
this.fillBar.width = (this.fillProgress / 100) * 236;
if (this.fillProgress >= 100) {
this.completed = true;
this.fillBar.setFillStyle(0x22c55e);
this.statusText.setText('WATER RESERVES RESTORED!');
this.subText.setText('Outpost water filtration and pressure nominal.');
this.scene.time.delayedCall(600, () => {
this.onComplete();
this.destroy();
});
}
}
}
destroy() {
if (this.closed) return;
this.closed = true;
this.scene.events.off('update', this.updateListener);
this.scene.input.keyboard.off('keydown-ESC', this.handleEscape);
this.objects.forEach(object => object.destroy());
this.onClose();
}
}
