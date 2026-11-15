import Phaser from 'phaser';

export default class AirlockEnvPanel {

    constructor(scene, envState, onTogglePanels, onStepOut, onClose) {
        this.scene = scene;
        this.envState = envState; // { radiation, dustLevel, panelsOpen }
        this.onTogglePanels = onTogglePanels;
        this.onStepOut = onStepOut;
        this.onClose = onClose;

        this.objects = [];
        this.closed = false;

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

    getRadiationStatus(sv) {
        if (sv <= 0.1) {
            return { label: 'SAFE TO GO OUT', color: '#22c55e', hex: 0x22c55e, safe: true };
        }
        if (sv <= 0.5) {
            return { label: 'CAUTION: SHORT EVA ONLY', color: '#eab308', hex: 0xeab308, safe: true };
        }
        return { label: 'UNSAFE: HIGH RADIATION!', color: '#ef4444', hex: 0xef4444, safe: false };
    }

    getDustStatus(dust) {
        if (dust === 'LIGHT') {
            return {
                title: 'LIGHT DUST STORM',
                advice: 'No action required. Keep solar panels OPEN for full power.',
                color: '#22c55e',
                hex: 0x22c55e
            };
        }
        if (dust === 'MODERATE') {
            return {
                title: 'MODERATE DUST STORM',
                advice: 'Trade-off: Leave OPEN for base power, or RETRACT to avoid wear.',
                color: '#eab308',
                hex: 0xeab308
            };
        }
        return {
            title: 'EXTREME DUST STORM',
            advice: 'DANGER! Retract solar panels IMMEDIATELY to prevent damage!',
            color: '#ef4444',
            hex: 0xef4444
        };
    }

    create() {
        // Dark overlay
        this.addObject(
            this.scene.add.rectangle(400, 290, 800, 600, 0x020617, 0.94),
            100
        );

        // Main console frame
        this.addObject(
            this.scene.add.rectangle(400, 300, 620, 400, 0x1e293b)
                .setStrokeStyle(3, 0x38bdf8),
            101
        );

        this.addObject(
            this.scene.add.text(400, 52, 'EXTERIOR AIRLOCK & SOLAR TELEMETRY', {
                fontSize: '22px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            102
        );

        this.addObject(
            this.scene.add.text(400, 80, 'Monitor Mars surface conditions before stepping out. Press ESC to close.', {
                fontSize: '13px',
                color: '#94a3b8'
            }).setOrigin(0.5),
            102
        );

        // --- LEFT CARD: RADIATION METER (0 to 10 Sv) ---
        this.addObject(
            this.scene.add.rectangle(245, 245, 270, 230, 0x0f172a)
                .setStrokeStyle(2, 0x475569),
            102
        );

        this.addObject(
            this.scene.add.text(245, 152, 'RADIATION METER (0–10 Sv)', {
                fontSize: '15px',
                color: '#38bdf8',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        this.radValueText = this.addObject(
            this.scene.add.text(245, 195, '', {
                fontSize: '28px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        // Meter bar background
        this.addObject(
            this.scene.add.rectangle(245, 235, 220, 18, 0x1e293b)
                .setStrokeStyle(1, 0x64748b),
            103
        );

        this.radBar = this.addObject(
            this.scene.add.rectangle(137, 235, 10, 14, 0x22c55e)
                .setOrigin(0, 0.5),
            104
        );

        this.radStatusText = this.addObject(
            this.scene.add.text(245, 268, '', {
                fontSize: '13px',
                color: '#22c55e',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5),
            103
        );

        // Step Out (EVA) Button
        this.evaBtn = this.addObject(
            this.scene.add.rectangle(245, 322, 210, 42, 0x16a34a)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true }),
            103
        );

        this.evaBtnText = this.addObject(
            this.scene.add.text(245, 322, 'STEP OUT (EVA)', {
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            104
        );

        this.evaBtn.on('pointerdown', () => {
            const status = this.getRadiationStatus(this.envState.radiation);
            if (!status.safe) {
                this.feedbackText.setText('AIRLOCK LOCKED: Radiation exceeds 0.5 Sv! Wait for levels to drop.');
                this.feedbackText.setColor('#ef4444');
                this.scene.cameras.main.shake(140, 0.004);
                return;
            }
            this.onStepOut(status);
            this.destroy();
        });

        // --- RIGHT CARD: DUST STORM & SOLAR PANELS ---
        this.addObject(
            this.scene.add.rectangle(555, 245, 270, 230, 0x0f172a)
                .setStrokeStyle(2, 0x475569),
            102
        );

        this.addObject(
            this.scene.add.text(555, 152, 'SOLAR ARRAY & DUST SENSOR', {
                fontSize: '15px',
                color: '#f59e0b',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        this.dustTitleText = this.addObject(
            this.scene.add.text(555, 188, '', {
                fontSize: '16px',
                color: '#22c55e',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        this.dustAdviceText = this.addObject(
            this.scene.add.text(555, 232, '', {
                fontSize: '12px',
                color: '#cbd5e1',
                align: 'center',
                wordWrap: { width: 240 }
            }).setOrigin(0.5),
            103
        );

        this.panelStateText = this.addObject(
            this.scene.add.text(555, 278, '', {
                fontSize: '14px',
                color: '#38bdf8',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            103
        );

        // Retract / Deploy Solar Panels Button
        this.solarBtn = this.addObject(
            this.scene.add.rectangle(555, 322, 210, 42, 0xd97706)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true }),
            103
        );

        this.solarBtnText = this.addObject(
            this.scene.add.text(555, 322, 'RETRACT PANELS', {
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5),
            104
        );

        this.solarBtn.on('pointerdown', () => {
            this.onTogglePanels();
            this.refreshUI();
        });

        // Bottom status feedback line
        this.feedbackText = this.addObject(
            this.scene.add.text(400, 405, 'Select an action or press ESC to return to base.', {
                fontSize: '14px',
                color: '#94a3b8',
                align: 'center'
            }).setOrigin(0.5),
            103
        );

        this.refreshUI();

        // Keep live readings updated while console is open
        this.updateListener = () => this.refreshUI();
        this.scene.events.on('update', this.updateListener);

        this.handleEscape = (event) => {
            if (event.key === 'Escape' || event.code === 'Escape') {
                event.preventDefault();
                this.destroy();
            }
        };
        window.addEventListener('keydown', this.handleEscape);
    }

    refreshUI() {
        if (this.closed) return;

        // Update Radiation Display
        const sv = this.envState.radiation;
        const radInfo = this.getRadiationStatus(sv);
        this.radValueText.setText(`${sv.toFixed(2)} Sv`);
        this.radValueText.setColor(radInfo.color);
        this.radStatusText.setText(radInfo.label);
        this.radStatusText.setColor(radInfo.color);

        // Scale bar across 0 to 10 Sv (minimum 8px width so 0.05 Sv is still visible)
        const pct = Math.min(1, Math.max(0.04, sv / 10));
        this.radBar.width = pct * 216;
        this.radBar.setFillStyle(radInfo.hex);

        this.evaBtn.setFillStyle(radInfo.safe ? 0x16a34a : 0x7f1d1d);

        // Update Dust & Solar Array Display
        const dustInfo = this.getDustStatus(this.envState.dustLevel);
        this.dustTitleText.setText(dustInfo.title);
        this.dustTitleText.setColor(dustInfo.color);
        this.dustAdviceText.setText(dustInfo.advice);

        if (this.envState.panelsOpen) {
            this.panelStateText.setText('SOLAR PANELS: OPEN (GENERATING)');
            this.panelStateText.setColor('#22c55e');
            this.solarBtnText.setText('RETRACT PANELS');
            this.solarBtn.setFillStyle(0xd97706);
        } else {
            this.panelStateText.setText('SOLAR PANELS: RETRACTED (SAFE)');
            this.panelStateText.setColor('#94a3b8');
            this.solarBtnText.setText('DEPLOY PANELS');
            this.solarBtn.setFillStyle(0x0284c7);
        }
    }

    destroy() {
        if (this.closed) return;
        this.closed = true;

        this.scene.events.off('update', this.updateListener);
        window.removeEventListener('keydown', this.handleEscape);

        this.objects.forEach(obj => obj.destroy());
        this.onClose();
    }
}
