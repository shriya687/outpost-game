import Phaser from 'phaser';
import astronautImage from './assets/astronaut-reference.png';
import surfaceBgImage from './assets/surface-bg.png';

export default class SurfaceScene extends Phaser.Scene {

    constructor() {
        super('SurfaceScene');
    }

    init(data) {
        // Receive current stats and radiation level from OutpostScene
        this.survival = data.survival || { oxygen: 60, water: 60, power: 60 };
        this.envState = data.envState || { radiation: 0.08 };
    }

    preload() {
        // Load surface background and astronaut sprite
        if (!this.textures.exists('surface-bg')) {
            this.load.image('surface-bg', surfaceBgImage);
        }
        if (!this.textures.exists('astronaut')) {
            this.load.image('astronaut', astronautImage);
        }
    }

    create() {
        // 1. Render the Martian surface background
        this.add.image(400, 300, 'surface-bg').setDisplaySize(800, 600);

        // 2. Align Airlock return zone with the ramp in the top-left of the artwork
        this.airlockHatch = { x: 215, y: 175 };

        this.airlockPrompt = this.add.text(225, 110, 'AIRLOCK [E] ENTER', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#38bdf8',
            backgroundColor: '#090d16cc',
            padding: { x: 6, y: 4 },
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Spawn Astronaut at the end of the Airlock ramp
        this.player = this.add.image(275, 220, 'astronaut').setScale(0.1).setDepth(10);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');

        // 4. Spawn Ice & Mineral Crystal Clusters inside the craters and fissures
        this.samples = [];
        this.collectedIce = 0;
        this.collectedMinerals = 0;

        const spawnSpots = [
            { x: 435, y: 315, type: 'MINERAL' }, // Center crater (Gold Mineral)
            { x: 655, y: 390, type: 'ICE' },     // Right crater (Blue Ice)
            { x: 615, y: 105, type: 'ICE' },     // Top-right crater (Blue Ice)
            { x: 635, y: 215, type: 'MINERAL' }, // Upper-right fissure (Gold Mineral)
            { x: 250, y: 455, type: 'ICE' },     // Bottom-left fissure (Blue Ice)
            { x: 525, y: 485, type: 'MINERAL' }  // Bottom-right fissure (Gold Mineral)
        ];

        spawnSpots.forEach((spot, index) => {
            const isIce = spot.type === 'ICE';
            const crystal = this.createCrystalCluster(spot.x, spot.y, isIce);
            crystal.sampleType = spot.type;
            crystal.collected = false;

            // Gentle floating pulse so crystals stand out against the terrain
            this.tweens.add({
                targets: crystal,
                y: spot.y - 4,
                duration: 900 + index * 120,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.samples.push(crystal);
        });

        // 5. Suit Radiation Exposure Meter
        this.suitDose = 0;
        this.maxSuitDose = 100;

        // Top HUD Bar
        this.add.rectangle(400, 24, 760, 32, 0x090d16, 0.85)
            .setStrokeStyle(2, 0x64748b)
            .setDepth(20);

        this.hudText = this.add.text(400, 24, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(21);

        // Bottom Instruction Bar
        this.add.rectangle(400, 574, 720, 32, 0x090d16, 0.85)
            .setStrokeStyle(2, 0xf59e0b)
            .setDepth(20);

        this.alertText = this.add.text(
            400,
            574,
            'Mine Blue Ice (+Water) & Gold Minerals (+Power), then return to Airlock!',
            {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#fef08a'
            }
        ).setOrigin(0.5).setDepth(21);

        // Radiation exposure tick every 1s while outside
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.radiationBriefingOpen) return;

                // Random chance of sudden solar radiation spike
                if (Math.random() < 0.08) {
                    this.envState.radiation = Number((0.6 + Math.random() * 4.5).toFixed(2));
                }

                const sv = this.envState.radiation;
                if (sv <= 0.1) {
                    this.suitDose += 2;  // Green: Safe, very slow buildup
                } else if (sv <= 0.5) {
                    this.suitDose += 5;  // Yellow: Moderate buildup
                } else {
                    this.suitDose += 14; // Red: Unsafe! Rapid radiation overload
                    this.cameras.main.shake(120, 0.004);
                }

                if (this.suitDose >= this.maxSuitDose) {
                    this.survival.oxygen = Math.max(0, this.survival.oxygen - 15);
                    this.returnToBase('EMERGENCY RECALL: Radiation limit exceeded! (-15 O2)');
                }
            }
        });

        this.showRadiationBriefing();
    }

    showRadiationBriefing() {
        this.radiationBriefingOpen = true;
        this.player.body.setVelocity(0, 0);

        const ui = [];
        const addObj = (obj) => {
            obj.setDepth(150);
            ui.push(obj);
            return obj;
        };

        addObj(
            this.add.rectangle(400, 300, 800, 600, 0x050811, 0.84)
                .setInteractive()
        );
        addObj(
            this.add.rectangle(400, 300, 650, 390, 0x131926, 0.98)
                .setStrokeStyle(3, 0xef4444)
        );
        addObj(
            this.add.rectangle(400, 145, 650, 40, 0xef4444, 0.2)
        );
        addObj(
            this.add.text(400, 145, 'MARS SURFACE RADIATION', {
                fontSize: '17px',
                fontFamily: 'monospace',
                color: '#f87171',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        addObj(
            this.add.text(122, 193, "Without a global magnetic field or thick atmosphere, Mars exposes spacewalkers to 0.64 mSv/day of Galactic Cosmic Rays - over 100 times Earth's surface rate.\n\nDuring solar flares, energetic particle bursts spike rapidly and force crews back into shielded habitats.\n\nThin EVA spacesuits offer limited shielding against high-energy solar storms, which can push crews toward NASA's 600 mSv career limit.", {
                fontSize: '15px',
                fontFamily: 'monospace',
                color: '#fee2e2',
                stroke: '#000000',
                strokeThickness: 0,
                wordWrap: { width: 556 },
                lineSpacing: 6
            })
        );
        addObj(
            this.add.text(400, 400, 'CLICK OR PRESS ENTER TO BEGIN EVA', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#94a3b8'
            }).setOrigin(0.5)
        );

        const continueButton = addObj(
            this.add.rectangle(400, 445, 250, 42, 0xef4444)
                .setInteractive({ useHandCursor: true })
        );
        addObj(
            this.add.text(400, 445, 'CONTINUE TO SURFACE >>', {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#090d16',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );

        const dismiss = () => {
            if (!this.radiationBriefingOpen) return;
            this.radiationBriefingOpen = false;
            this.input.keyboard.off('keydown-ENTER', dismiss);
            ui.forEach(obj => obj.destroy());
        };

        continueButton.on('pointerdown', dismiss);
        this.input.keyboard.on('keydown-ENTER', dismiss);
    }

    // Draws a 3-shard pixel-style crystal cluster matching the game's art style
    createCrystalCluster(x, y, isIce) {
        const container = this.add.container(x, y).setDepth(5);
        const g = this.add.graphics();

        const glowColor = isIce ? 0x38bdf8 : 0xfacc15;
        const mainColor = isIce ? 0x0ea5e9 : 0xf59e0b;
        const lightColor = isIce ? 0xbae6fd : 0xfef08a;
        const outlineColor = 0x2c1a22; // Warm maroon-brown outline matching artwork

        // Soft ground glow under crystal
        g.fillStyle(glowColor, 0.28);
        g.fillEllipse(0, 8, 36, 16);

        // Left angled shard
        g.lineStyle(2, outlineColor, 1);
        g.fillStyle(mainColor, 1);
        g.beginPath();
        g.moveTo(-12, 8);
        g.lineTo(-16, -6);
        g.lineTo(-10, -12);
        g.lineTo(-4, 6);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Right angled shard
        g.beginPath();
        g.moveTo(4, 6);
        g.lineTo(10, -10);
        g.lineTo(16, -4);
        g.lineTo(12, 8);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Center tall main shard
        g.beginPath();
        g.moveTo(-6, 10);
        g.lineTo(-6, -14);
        g.lineTo(0, -22);
        g.lineTo(6, -14);
        g.lineTo(6, 10);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Highlight facet on center crystal
        g.fillStyle(lightColor, 0.9);
        g.beginPath();
        g.moveTo(-4, 6);
        g.lineTo(-4, -13);
        g.lineTo(0, -19);
        g.lineTo(0, 6);
        g.closePath();
        g.fillPath();

        container.add(g);
        return container;
    }

    returnToBase(message) {
        this.scene.start('OutpostScene', {
            survival: this.survival,
            envState: this.envState,
            evaMessage: message
        });
    }

    update() {
        if (this.radiationBriefingOpen) return;

        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) dx--;
        if (this.cursors.right.isDown || this.keys.D.isDown) dx++;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy--;
        if (this.cursors.down.isDown || this.keys.S.isDown) dy++;

        // Flip astronaut sprite to face walking direction
        if (dx < 0) {
            this.player.setFlipX(true);
        } else if (dx > 0) {
            this.player.setFlipX(false);
        }

        const vel = new Phaser.Math.Vector2(dx, dy).normalize().scale(190);
        this.player.body.setVelocity(vel.x, vel.y);

        // Check crystal collection
        for (const s of this.samples) {
            if (s.collected) continue;
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y) < 34) {
                s.collected = true;

                // Pop-up shrink animation when mined
                this.tweens.add({
                    targets: s,
                    scaleX: 1.4,
                    scaleY: 1.4,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => s.destroy()
                });

                if (s.sampleType === 'ICE') {
                    this.collectedIce++;
                    this.survival.water = Math.min(100, this.survival.water + 8);
                } else {
                    this.collectedMinerals++;
                    this.survival.power = Math.min(100, this.survival.power + 8);
                }
            }
        }

        // Check return to Airlock ramp
        const nearAirlock = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.airlockHatch.x,
            this.airlockHatch.y
        ) < 75;

        this.airlockPrompt.setVisible(nearAirlock);

        if (nearAirlock && Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.returnToBase(
                `EVA Complete! Recovered ${this.collectedIce} Ice (+Water) & ${this.collectedMinerals} Minerals (+Power).`
            );
        }

        // Update EVA HUD
        const sv = this.envState.radiation;
        const zone = sv <= 0.1 ? 'GREEN (SAFE)' : sv <= 0.5 ? 'YELLOW (LIMITED)' : 'RED (UNSAFE!)';
        this.hudText.setText(
            `MARS EVA SURFACE | RADIATION: ${sv.toFixed(2)} Sv [${zone}] | SUIT DOSE: ${Math.min(100, this.suitDose)}%`
        );
        this.hudText.setColor(sv <= 0.1 ? '#22c55e' : sv <= 0.5 ? '#eab308' : '#ef4444');
    }
}

