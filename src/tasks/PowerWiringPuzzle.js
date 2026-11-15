import Phaser from 'phaser';
export default class PowerReactor {

    constructor(scene, onComplete, onClose) {
        this.scene = scene;
        this.onComplete = onComplete;
        this.onClose = onClose;

        this.objects = [];
        this.wires = [];
        this.closed = false;
        this.completed = false;

        this.stage = 'WIRING';
        this.activeWire = null;
        this.needleAngle = 0;

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

    create() {
        // Dark background overlay
        this.addObject(
            this.scene.add.rectangle(400, 300, 800, 600, 0x020617, 0.95),
            100
        );

        // Main electrical panel frame
        this.addObject(
            this.scene.add.rectangle(400, 300, 560, 390, 0x1e293b)
                .setStrokeStyle(3, 0xf59e0b),
            101
        );

        // Left & Right terminal strips
        this.addObject(
            this.scene.add.rectangle(165, 305, 64, 330, 0x0f172a)
                .setStrokeStyle(2, 0x475569),
            102
        );
        this.addObject(
            this.scene.add.rectangle(635, 305, 64, 330, 0x0f172a)
                .setStrokeStyle(2, 0x475569),
            102
        );

        // Header & Instructions
        this.statusText = this.addObject(
            this.scene.add.text(400, 50, 'STEP 1: RECONNECT POWER CABLES', {
                fontSize: '24px',
                color: '#f59e0b',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            102
        );

        this.subText = this.addObject(
            this.scene.add.text(400, 84, 'Drag each colored wire on the left to its matching terminal on the right.', {
                fontSize: '14px',
                color: '#94a3b8'
            }).setOrigin(0.5),
            102
        );

        // Graphics layer for drawing dynamic cables
        this.wireGraphics = this.addObject(
            this.scene.add.graphics(),
            105
        );

        // Define 4 wire colors and vertical Y coordinates
        const wireDefs = new Array(
            { name: 'RED', color: 0xef4444 },
            { name: 'BLUE', color: 0x38bdf8 },
            { name: 'YELLOW', color: 0xfacc15 },
            { name: 'GREEN', color: 0x22c55e }
        );

        const yPositions = new Array(180, 260, 340, 420);
        const leftOrder = Phaser.Utils.Array.Shuffle(wireDefs.slice());
        const rightOrder = Phaser.Utils.Array.Shuffle(wireDefs.slice());

        // Draw right-side target sockets
        const rightSockets = {};
        rightOrder.forEach((def, idx) => {
            const ry = yPositions.at(idx);

            this.addObject(
                this.scene.add.rectangle(635, ry, 44, 28, def.color)
                    .setStrokeStyle(2, 0xffffff),
                103
            );

            this.addObject(
                this.scene.add.circle(605, ry, 8, 0x334155)
                    .setStrokeStyle(2, def.color),
                103
            );

            rightSockets[def.name] = { x: 605, y: ry };
        });

        // Draw left-side draggable plugs
        leftOrder.forEach((def, idx) => {
            const ly = yPositions.at(idx);
            const target = rightSockets[def.name];

            // Fixed left terminal block
            this.addObject(
                this.scene.add.rectangle(165, ly, 44, 28, def.color)
                    .setStrokeStyle(2, 0xffffff),
                103
            );

            // Draggable cable connector plug
            const plug = this.addObject(
                this.scene.add.rectangle(202, ly, 26, 20, def.color)
                    .setStrokeStyle(2, 0xffffff)
                    .setInteractive({ draggable: true, useHandCursor: true }),
                106
            );

            const wireObj = {
                name: def.name,
                color: def.color,
                startX: 188,
                startY: ly,
                endX: 202,
                endY: ly,
                targetX: target.x,
                targetY: target.y,
                plug: plug,
                connected: false
            };

            this.scene.input.setDraggable(plug);
            this.wires.push(wireObj);
        });

        // Drag handlers
        this.onDragStart = (pointer, gameObject) => {
            if (this.stage !== 'WIRING') return;
            const wire = this.wires.find(w => w.plug === gameObject);
            if (!wire || wire.connected) return;
            this.activeWire = wire;
            gameObject.setScale(1.2);
        };

        this.onDrag = (pointer, gameObject, dragX, dragY) => {
            if (this.stage !== 'WIRING') return;
            const wire = this.wires.find(w => w.plug === gameObject);
            if (!wire || wire.connected) return;

            wire.endX = Phaser.Math.Clamp(dragX, 195, 625);
            wire.endY = Phaser.Math.Clamp(dragY, 130, 475);
            gameObject.x = wire.endX;
            gameObject.y = wire.endY;

            const dist = Phaser.Math.Distance.Between(
                wire.endX, wire.endY,
                wire.targetX, wire.targetY
            );

            if (dist < 28) {
                wire.connected = true;
                wire.endX = wire.targetX;
                wire.endY = wire.targetY;
                gameObject.x = wire.targetX;
                gameObject.y = wire.targetY;
                gameObject.setScale(1);
                gameObject.disableInteractive();
                this.activeWire = null;
                this.checkAllWiresConnected();
            }
        };

        this.onDragEnd = (pointer, gameObject) => {
            const wire = this.wires.find(w => w.plug === gameObject);
            if (!wire) return;
            gameObject.setScale(1);

            if (!wire.connected) {
                wire.endX = 202;
                wire.endY = wire.startY;
                gameObject.x = wire.endX;
                gameObject.y = wire.endY;
            }
            this.activeWire = null;
        };

        this.scene.input.on('dragstart', this.onDragStart);
        this.scene.input.on('drag', this.onDrag);
        this.scene.input.on('dragend', this.onDragEnd);

        // Stage 2 Calibration UI
        this.createCalibrationUI();

        // Update loop
        this.updateListener = () => this.updatePuzzle();
        this.scene.events.on('update', this.updateListener);

        // Escape to exit
        this.handleEscape = () => this.destroy();
        this.scene.input.keyboard.on('keydown-ESC', this.handleEscape);
    }

    checkAllWiresConnected() {
        const remaining = this.wires.filter(w => !w.connected).length;
        if (remaining > 0) {
            this.subText.setText(`Cable locked! ${remaining} cable${remaining > 1 ? 's' : ''} remaining.`);
            return;
        }

        this.stage = 'CALIBRATE';
        this.statusText.setText('STEP 2: CALIBRATE REACTOR PHASE');
        this.statusText.setColor('#38bdf8');
        this.subText.setText('Click LOCK PHASE when the white needle enters the amber zone!');
        this.showCalibrationUI();
    }

    createCalibrationUI() {
        this.calElements = [];

        const panel = this.addObject(
            this.scene.add.rectangle(400, 300, 320, 230, 0x0f172a, 0.96)
                .setStrokeStyle(2, 0xf59e0b)
                .setVisible(false),
            115
        );

        const dialRing = this.addObject(
            this.scene.add.circle(400, 270, 62, 0x1e293b)
                .setStrokeStyle(4, 0x64748b)
                .setVisible(false),
            116
        );

        const targetZone = this.addObject(
            this.scene.add.rectangle(400, 212, 34, 16, 0xf59e0b)
                .setStrokeStyle(2, 0xffffff)
                .setVisible(false),
            117
        );

        this.needle = this.addObject(
            this.scene.add.rectangle(400, 270, 6, 56, 0xffffff)
                .setOrigin(0.5, 1)
                .setVisible(false),
            118
        );

        const centerCap = this.addObject(
            this.scene.add.circle(400, 270, 10, 0xf59e0b)
                .setVisible(false),
            119
        );

        const lockBtn = this.addObject(
            this.scene.add.rectangle(400, 372, 180, 42, 0xd97706)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true })
                .setVisible(false),
            117
        );

        const lockBtnText = this.addObject(
            this.scene.add.text(400, 372, 'LOCK PHASE', {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setVisible(false),
            118
        );

        lockBtn.on('pointerdown', () => {
            if (this.stage !== 'CALIBRATE' || this.completed) return;

            let deg = ((this.needleAngle % 360) + 360) % 360;
            if (deg > 180) deg -= 360;

            if (Math.abs(deg) <= 22) {
                this.completed = true;
                dialRing.setStrokeStyle(4, 0x22c55e);
                targetZone.setFillStyle(0x22c55e);
                lockBtn.setFillStyle(0x16a34a);
                this.statusText.setText('POWER GRID RESTORED!');
                this.statusText.setColor('#22c55e');
                this.subText.setText('Outpost reactor phase synchronized at 100%.');

                this.scene.time.delayedCall(600, () => {
                    this.onComplete();
                    this.destroy();
                });
            } else {
                this.subText.setText('Phase misaligned! Wait for the needle to hit the top amber marker.');
                this.scene.cameras.main.shake(120, 0.004);
            }
        });

this.calElements.push(panel, dialRing, targetZone, this.needle, centerCap, lockBtn, lockBtnText);
}
showCalibrationUI() {
this.calElements.forEach(el => el.setVisible(true));
}
updatePuzzle() {
if (this.closed) return;
this.wireGraphics.clear();
for (const wire of this.wires) {
this.wireGraphics.lineStyle(10, 0x090d16, 1);
this.wireGraphics.beginPath();
this.wireGraphics.moveTo(wire.startX, wire.startY);
this.wireGraphics.lineTo(wire.endX, wire.endY);
this.wireGraphics.strokePath();
this.wireGraphics.lineStyle(6, wire.color, 1);
this.wireGraphics.beginPath();
this.wireGraphics.moveTo(wire.startX, wire.startY);
this.wireGraphics.lineTo(wire.endX, wire.endY);
this.wireGraphics.strokePath();
}
if (this.stage === 'CALIBRATE' && !this.completed) {
this.needleAngle = (this.needleAngle + 3.2) % 360;
this.needle.setAngle(this.needleAngle);
}
}
destroy() {
if (this.closed) return;
this.closed = true;
this.scene.events.off('update', this.updateListener);
this.scene.input.off('dragstart', this.onDragStart);
this.scene.input.off('drag', this.onDrag);
this.scene.input.off('dragend', this.onDragEnd);
this.scene.input.keyboard.off('keydown-ESC', this.handleEscape);
this.objects.forEach(object => object.destroy());
this.onClose();
}
}