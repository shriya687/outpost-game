
export default class AirlockPuzzle {

    constructor(scene, onComplete, onClose) {

        this.scene = scene;
        this.onComplete = onComplete;
        this.onClose = onClose;

        this.objects = [];
        this.rotations = [90, 0, 90, 90];
        this.closed = false;

        this.create();

    }

    // Add objects to the mini-game
    addObject(object) {

        object.setDepth(100);
        this.objects.push(object);

        return object;

    }

    create() {

        // Dark background overlay
        this.addObject(
            this.scene.add.rectangle(
                400, 300, 800, 600, 0x020617, 0.95
            ).setInteractive()
        );

        // Title
        this.addObject(
            this.scene.add.text(
                400, 100, 'AIRLOCK PANIC',
                {
                    fontSize: '32px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5)
        );

        // Instructions
        this.addObject(
            this.scene.add.text(
                400, 160,
                'Rotate the pipes to restore oxygen circulation.',
                {
                    fontSize: '17px',
                    color: '#94a3b8'
                }
            ).setOrigin(0.5)
        );

        // Create four pipe segments
        this.pipes = [];

        for (let i = 0; i < 4; i++) {

            const x = 250 + i * 100;
            const y = 300;

            // Background tile
            this.addObject(
                this.scene.add.rectangle(
                    x, y, 70, 70, 0x1e293b
                ).setStrokeStyle(2, 0x64748b)
            );

            // Pipe
            const pipe = this.addObject(
                this.scene.add.rectangle(
                    x, y, 52, 12, 0x38bdf8
                ).setInteractive({ useHandCursor: true })
            );

            pipe.setAngle(this.rotations[i]);

            // Clicking rotates the pipe
            pipe.on('pointerdown', () => {

                this.rotations[i] =
                    this.rotations[i] === 0 ? 90 : 0;

                pipe.setAngle(this.rotations[i]);

            });

            this.pipes.push(pipe);

        }

        // Feedback text
        this.feedback = this.addObject(
            this.scene.add.text(
                400, 390, 'Click each blue pipe to rotate it.',
                {
                    fontSize: '18px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5)
        );

        // Check button
        const button = this.addObject(
            this.scene.add.rectangle(
                400, 470, 200, 55, 0x16a34a
            ).setInteractive({ useHandCursor: true })
        );

        this.addObject(
            this.scene.add.text(
                400, 470, 'CHECK AIRFLOW',
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5)
        );

        button.on('pointerdown', () => this.check());

        // Escape to exit
        this.handleEscape = () => this.destroy();

        this.scene.input.keyboard.on(
            'keydown-ESC',
            this.handleEscape
        );

    }

    // Check whether all pipes are horizontal
    check() {

        const connected = this.rotations.every(
            rotation => rotation === 0
        );

        if (connected) {

            this.onComplete();

            this.destroy();

        } else {

            this.feedback.setText(
                'Airflow interrupted! Align all four pipes.'
            );

            this.feedback.setColor('#f87171');

        }

    }

    // Close the mini-game
    destroy() {

        if (this.closed) return;

        this.closed = true;

        this.scene.input.keyboard.off(
            'keydown-ESC',
            this.handleEscape
        );

        this.objects.forEach(object => object.destroy());

        this.onClose();

    }

}
