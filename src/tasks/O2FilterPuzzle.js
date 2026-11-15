export default class O2FilterPuzzle {

    constructor(scene, onComplete, onClose) {
        this.scene = scene;
        this.onComplete = onComplete;
        this.onClose = onClose;

        this.objects = [];
        this.leaves = [];
        this.leafCount = 6;
        this.closed = false;
        this.completed = false;

        this.chuteRight = 230;
        this.leftEdge = 130;
        this.rightEdge = 670;
        this.topEdge = 110;
        this.bottomEdge = 490;

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

    createLeafTexture() {
        if (this.scene.textures.exists('o2_leaf')) return;

        const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
        // Draw leaf body
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(24, 14, 42, 22);
        // Draw leaf stem/vein
        g.lineStyle(2, 0x1e293b, 0.8);
        g.lineBetween(4, 14, 44, 14);
        g.generateTexture('o2_leaf', 48, 28);
        g.destroy();
    }
    

    create() {
        this.createLeafTexture();

        this.addObject(
            this.scene.add.rectangle(400, 300, 800, 600, 0x020617, 0.95),
            100
        );

        // Main chamber box
        this.addObject(
            this.scene.add.rectangle(400, 300, 540, 380, 0x1e293b)
                .setStrokeStyle(3, 0x64748b),
            101
        );

        // Air vent grates
        for (let y = 160; y <= 450; y += 36) {
            this.addObject(
                this.scene.add.rectangle(450, y, 400, 14, 0x0f172a),
                101
            );
        }

        // Left vacuum chute
        this.addObject(
            this.scene.add.rectangle(180, 300, 100, 376, 0x090d16),
            101
        );
        this.addObject(
            this.scene.add.rectangle(230, 300, 6, 376, 0xeab308),
            101
        );
        this.addObject(
            this.scene.add.text(180, 300, '<<<\nO2\nOUT', {
                fontSize: '18px',
                color: '#38bdf8',
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            101
        );

        // Title & Instructions
        this.statusText = this.addObject(
            this.scene.add.text(400, 55, 'CLEAN O2 FILTER (LEAVES: 6)', {
                fontSize: '26px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            102
        );

        this.addObject(
            this.scene.add.text(400, 88, 'Drag all floating leaves into the left oxygen chute. Press ESC to exit.', {
                fontSize: '15px',
                color: '#94a3b8'
            }).setOrigin(0.5),
            102
        );

        // Spawn leaves as real Image sprites
        const colors = [0xd97706, 0xea580c, 0x16a34a, 0xdc2626, 0xeab308];

        for (let i = 0; i < this.leafCount; i++) {
            const x = Math.floor(Math.random() * (620 - 280 + 1)) + 280;
            const y = Math.floor(Math.random() * (440 - 150 + 1)) + 150;
            const color = colors[Math.floor(Math.random() * colors.length)];

            const leaf = this.addObject(
                this.scene.add.image(x, y, 'o2_leaf')
                    .setTint(color)
                    .setAngle(Math.random() * 360)
                    .setInteractive({ draggable: true, useHandCursor: true }),
                105
            );

            leaf.vx = (Math.random() - 0.5) * 1.5;
            leaf.vy = (Math.random() - 0.5) * 1.5;
            leaf.vAngle = (Math.random() - 0.5) * 1.5;
            leaf.isDragging = false;
            leaf.isCleared = false;

            this.scene.input.setDraggable(leaf);
            this.leaves.push(leaf);
        }

        // Drag listeners
        this.onDragStart = (pointer, gameObject) => {
            if (!this.leaves.includes(gameObject) || gameObject.isCleared) return;
            gameObject.isDragging = true;
            gameObject.setScale(1.2);
            gameObject.setDepth(110);
        };

        this.onDrag = (pointer, gameObject, dragX, dragY) => {
            if (!this.leaves.includes(gameObject) || gameObject.isCleared) return;
            gameObject.x = Math.max(this.leftEdge + 20, Math.min(this.rightEdge - 20, dragX));
            gameObject.y = Math.max(this.topEdge + 20, Math.min(this.bottomEdge - 20, dragY));

            if (gameObject.x <= this.chuteRight - 10) {
                this.clearLeaf(gameObject);
            }
        };

        this.onDragEnd = (pointer, gameObject) => {
            if (!this.leaves.includes(gameObject) || gameObject.isCleared) return;
            gameObject.isDragging = false;
            gameObject.setScale(1);
            gameObject.setDepth(105);
        };

        this.scene.input.on('dragstart', this.onDragStart);
        this.scene.input.on('drag', this.onDrag);
        this.scene.input.on('dragend', this.onDragEnd);

        // Floating physics update
        this.updateListener = () => this.updateLeaves();
        this.scene.events.on('update', this.updateListener);

        // Escape to exit
        this.handleEscape = () => this.destroy();
        this.scene.input.keyboard.on('keydown-ESC', this.handleEscape);
    }

    clearLeaf(leaf) {
        if (leaf.isCleared) return;
        leaf.isCleared = true;
        leaf.disableInteractive();

        this.scene.tweens.add({
            targets: leaf,
            x: 160,
            scaleX: 0.1,
            scaleY: 0.1,
            alpha: 0,
            duration: 180,
            onComplete: () => {
                leaf.setVisible(false);
                this.checkWin();
            }
        });
    }

    checkWin() {
        const remaining = this.leaves.filter(l => !l.isCleared).length;
        this.statusText.setText(`CLEAN O2 FILTER (LEAVES: ${remaining})`);

        if (remaining === 0 && !this.completed) {
            this.completed = true;
            this.statusText.setText('FILTER CLEANED! OXYGEN RESTORED!');
            this.statusText.setColor('#22c55e');

            this.scene.time.delayedCall(500, () => {
                this.onComplete();
                this.destroy();
            });
        }
    }

    updateLeaves() {
        if (this.completed || this.closed) return;

        for (const leaf of this.leaves) {
            if (leaf.isCleared || leaf.isDragging) continue;

            leaf.vx += (Math.random() - 0.5) * 0.12;
            leaf.vy += (Math.random() - 0.5) * 0.12;

            if (leaf.x < this.chuteRight + 60) {
                leaf.vx += 0.08;
            }

            leaf.vx *= 0.96;
            leaf.vy *= 0.96;

            leaf.x += leaf.vx;
            leaf.y += leaf.vy;
            leaf.angle += leaf.vAngle;

            if (leaf.x < this.chuteRight + 22) {
                leaf.x = this.chuteRight + 22;
                leaf.vx *= -0.7;
            }
            if (leaf.x > this.rightEdge - 22) {
                leaf.x = this.rightEdge - 22;
                leaf.vx *= -0.7;
            }
            if (leaf.y < this.topEdge + 22) {
                leaf.y = this.topEdge + 22;
                leaf.vy *= -0.7;
            }
            if (leaf.y > this.bottomEdge - 22) {
                leaf.y = this.bottomEdge - 22;
                leaf.vy *= -0.7;
            }
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


