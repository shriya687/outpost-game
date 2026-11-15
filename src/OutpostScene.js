import Phaser from 'phaser';
import astronautImage from './assets/astronaut-reference.png';
import outpostBgImage from './assets/outpost_bg.png';
import O2FilterPuzzle from './tasks/O2FilterPuzzle.js';
import WaterPipePuzzle from './tasks/WaterPipePuzzle.js';
import PowerWiringPuzzle from './tasks/PowerWiringPuzzle.js';
import AirlockEnvPanel from './tasks/AirlockEnvPanel.js';
import wingSignsImage from './assets/wing-signs.png';
import CommandTerminal from './tasks/CommandTerminal.js';
import centralSignImage from './assets/central-sign.png';
import bgMusicFile from './assets/space-bg.mp3';

const TASK_BRIEFINGS = {
    oxygen: {
        title: 'OXYGEN GENERATION',
        accentHex: 0x22c55e,
        accentColor: '#22c55e',
        pages: [
            'Space stations mainly make oxygen by using electricity to split water into hydrogen and oxygen. Solar panels provide the power, and the oxygen is released into the cabin.',
            'As a backup, oxygen candles use chemicals such as sodium chlorate and iron powder. A heat-driven reaction releases oxygen when the main system is unavailable.'
        ]
    },
    water: {
        title: 'WATER RECYCLING',
        accentHex: 0x38bdf8,
        accentColor: '#38bdf8',
        pages: [
            'Most station water is recycled. Sources include urine, sweat, breath moisture, and hygiene water. Together, the recycling systems are part of ECLSS: the Environmental Control and Life Support System.',
            'The UPA distills urine. The BPA recovers more water from the leftover brine by using warm, dry air and a special membrane.',
            'The WPA uses multi-filtration beds, a high-temperature catalytic reactor to break down trace organics, and iodine to control microbes.'
        ]
    },
    power: {
        title: 'POWER GENERATION',
        accentHex: 0xf59e0b,
        accentColor: '#f59e0b',
        pages: [
            'Solar cells use semiconductor materials to turn light into electricity. Light frees electrons, and the cell’s internal electric field makes them flow as current.',
            'During daylight, the station uses solar electricity directly and stores excess energy in batteries for use at night.'
        ]
    }
};

export default class OutpostScene extends Phaser.Scene {

    constructor() {
        super('OutpostScene');
    }

    init(data) {
        this.savedSurvival = data && data.survival ? data.survival : null;
        this.savedEnv = data && data.envState ? data.envState : null;
        this.evaMessage = data && data.evaMessage ? data.evaMessage : null;
    }
    preload() {
        this.load.image('astronaut', astronautImage);
        this.load.image('outpost_bg', outpostBgImage);
        this.load.image('wing-signs', wingSignsImage);
        this.load.image('central-sign', centralSignImage);
        this.load.audio('bg-music', bgMusicFile);
    }

    //createHudPanels() {
          // 1. TOP-LEFT PANEL (Title + Oxygen / Water / Power stats)
        //this.add.rectangle(100, 40, 184, 108, 0x090d16, 0.86)
        //    .setStrokeStyle(2, 0x22c55e)
        //    .setDepth(18);

        // 2. TOP-CENTER PANEL (SOL 1 / 5 & Daytime/Night status)
        //this.add.rectangle(415, 28, 250, 42, 0x090d16, 0.86)
        //    .setStrokeStyle(2, 0xfacc15)
        //    .setDepth(18);

        // 3. TOP-RIGHT PANEL (Radiation, Dust Storm, Panels/Heater)
        //this.add.rectangle(678, 36, 228, 58, 0x090d16, 0.86)
        //    .setStrokeStyle(2, 0x38bdf8)
        //    .setDepth(18);

        // 4. BOTTOM ACTION & HOTKEY BAR (Covers both bottom lines cleanly)
        //this.add.rectangle(400, 568, 784, 52, 0x090d16, 0.88)
        //    .setStrokeStyle(2, 0x64748b)
        //    .setDepth(18);

    create() {
        this.activePuzzle = null;
        this.gameEnded = false;

        // Mars base background (tints darker at night!)
        //this.baseRoom = this.add.rectangle(
            //400, 300, 760, 520, 0x26384a
        //).setStrokeStyle(4, 0x94a3b8);

         // Mars base background image (keeps this.baseRoom so your night tinting still works!)
        this.baseRoom = this.add.image(400, 300, 'outpost_bg')
            .setDisplaySize(800, 600);

        this.add.text(792, 544, 'Background generated using AI', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#090d16e6',
            padding: { x: 4, y: 2 },
            stroke: '#090d16',
            strokeThickness: 1
        }).setOrigin(1, 1).setDepth(32);

        // Title
        this.add.text(28, 18, 'MARS OUTPOST', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        // Start playing looped background music across all scenes
        if (!this.sound.get('bg-music')) {
            const music = this.sound.add('bg-music', {
                volume: 0.35, // 35% volume so it stays subtle
                loop: true
            });
            music.play();
        }

        // Pixel-Art Astronaut
        this.player = this.add.image(295, 300, 'astronaut').setScale(0.1).setDepth(10);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // Restrict movement strictly inside the base walls
        this.createBaseWalls();

        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // Controls (including H for Heater Trade-off & C for Water->O2 Electrolysis)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E,H,C');
        
        // Solid invisible collider over the central command table so the astronaut walks around it
        const commandTable = this.add.rectangle(400, 295, 130, 85, 0x000000, 0);
        this.physics.add.existing(commandTable, true);
        this.physics.add.collider(this.player, commandTable);

        //this.createHudPanels();

        // Survival stations
        this.stations = [
            {
                x: 215,
                y: 175,
                name: 'OXYGEN',
                system: 'oxygen',
                color: 0x22c55e
            },
            {
                x: 585,
                y: 175,
                name: 'WATER',
                system: 'water',
                color: 0x38bdf8
            },
            {
                x: 215,
                y: 440,
                name: 'POWER',
                system: 'power',
                color: 0xf59e0b
            },
            {
                x: 585,
                y: 440,
                name: 'AIRLOCK',
                system: 'airlock',
                color: 0xa855f7
            },
            {
                x: 400,
                y: 300,
                name: 'COMMAND TERMINAL',
                system: 'command'
            }

        ];

        // Draw stations
        //this.stations.forEach(station => {
            //this.add.rectangle(
            //    station.x,
            //    station.y,
            //    80,
            //    54,
            //    station.color
            //).setStrokeStyle(2, 0xffffff);

            //this.add.text(
            //    station.x,
            //    station.y + 42,
            //    station.name,
            //    {
            //        fontSize: '14px',
            //        color: '#ffffff'
            //    }
            //).setOrigin(0.5);
        //});

        // Restore saved levels after EVA, or start at 65
        this.survival = this.savedSurvival || {
            oxygen: 65,
            water: 65,
            power: 65
        };

        this.envState = this.savedEnv || {
            radiation: 0.06,      // 0 to 10 Sv
            dustLevel: 'LIGHT',   // 'LIGHT', 'MODERATE', 'EXTREME'
            panelsOpen: true,
            isDay: true,
            sol: 1,
            tickCount: 0,
            heaterHigh: true       // Trade-off: HIGH saves O2 at night but costs Power; ECO saves Power
        };

        // Top-Left Survival HUD
        this.hud = this.add.text(
            28, 50,
            this.getHudText(),
            {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
                depth:25
            }
        );

        // Top-Center Sol & Day/Night Clock
        this.solHud = this.add.text(
            400, 22,
            this.getSolHudText(),
            {
                fontSize: '16px',
                color: '#facc15',
                fontStyle: 'bold',
                align: 'center',
                depth:25
            }
        ).setOrigin(0.5, 0);

        // Top-Right Exterior Telemetry & Trade-off HUD
        this.envHud = this.add.text(
            772, 20,
            this.getEnvHudText(),
            {
                fontSize: '13px',
                color: '#cbd5e1',
                align: 'right',
                depth:25
            }
        ).setOrigin(1, 0);

        // Bottom Action / Alert Prompt
        this.prompt = this.add.text(
            28, 545,
            this.evaMessage || 'WASD: Move | E: Station | H: Toggle Heater | C: Split Water->O2',
            {
                fontSize: '14px',
                color: '#ffffff',
                depth:25
            }
        );

        // Secondary Trade-off Hint Bar
        this.tradeoffBar = this.add.text(
            28, 568,
            '[H] Heater: HIGH (Safe O2, -Power)   |   [C] Electrolysis: -15 Water & -10 Power -> +20 O2',
            {
                fontSize: '12px',
                color: '#94a3b8'
            }
        );

        const storyButton = this.add.rectangle(735, 570, 100, 32, 0x2d1e18)
            .setStrokeStyle(2, 0x94a3b8)
            .setInteractive({ useHandCursor: true })
            .setDepth(30);
        this.add.text(735, 570, '<< BACK', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(31);

        storyButton.on('pointerover', () => storyButton.setStrokeStyle(2, 0x22c55e));
        storyButton.on('pointerout', () => storyButton.setStrokeStyle(2, 0x94a3b8));
        storyButton.on('pointerdown', () => this.scene.start('StoryScene'));

        // Main 4-second Martian Simulation Tick
        this.time.addEvent({
            delay: 7000,
            loop: true,
            callback: () => this.onSimulationTick()
        });

        this.createWingSigns();
        this.createCentralSign();
    }

    createWingSigns() {
    // 1. Strip the dark slate background from 'wing-signs' to make it transparent
    if (!this.textures.exists('wing-signs-clean')) {
        const srcImg = this.textures.get('wing-signs').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = srcImg.width;
        canvas.height = srcImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(srcImg, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Target slate background color (~RGB 40, 48, 61) and make it transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Match the outer slate background while keeping the darker inner sign screen (#0e141b)
            if (Math.abs(r - 40) < 14 && Math.abs(g - 48) < 14 && Math.abs(b - 61) < 14) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
        }

        ctx.putImageData(imgData, 0, 0);
        this.textures.addCanvas('wing-signs-clean', canvas);
    }

    const tex = this.textures.get('wing-signs-clean').getSourceImage();
    const halfW = tex.width / 2;
    const halfH = tex.height / 2;

    // 2. Position each waypoint marker cleanly over its wing (clear of the top-left HUD!)
    const signs = [
        {
            cropX: 0,
            cropY: 0,
            x: 215,
            y: 112
        },
        {
            cropX: halfW,
            cropY: 0,
            x: 615,
            y: 112
        },
        {
            cropX: 0,
            cropY: halfH,
            x: 220,
            y: 390
        },
        {
            cropX: halfW,
            cropY: halfH,
            x: 575,
            y: 385
        }
    ];

    const badgeWidth = 115;
    const scale = badgeWidth / halfW;

    signs.forEach((s, index) => {
        const signSprite = this.add.image(s.x, s.y, 'wing-signs-clean')
            .setCrop(s.cropX, s.cropY, halfW, halfH)
            .setScale(scale)
            .setDepth(15);

        const originX = s.cropX === 0 ? 0.25 : 0.75;
        const originY = s.cropY === 0 ? 0.25 : 0.75;
        signSprite.setOrigin(originX, originY);

        // 3. Smooth floating waypoint bobbing animation
        this.tweens.add({
            targets: signSprite,
            y: s.y - 6,
            duration: 1100 + index * 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    });
    }

    createCentralSign() {
    // 1. Strip the dark slate background padding around the riveted metal frame
    if (!this.textures.exists('central-sign-clean')) {
        const srcImg = this.textures.get('central-sign').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = srcImg.width;
        canvas.height = srcImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(srcImg, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample top-left corner pixel so background removal matches exact image shade
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (Math.abs(r - bgR) < 16 && Math.abs(g - bgG) < 16 && Math.abs(b - bgB) < 16) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
        }

        ctx.putImageData(imgData, 0, 0);
        this.textures.addCanvas('central-sign-clean', canvas);
    }

    // 2. Place the sign above the central console
    const signContainer = this.add.container(400, 178).setDepth(16);

    const signSprite = this.add.image(0, 0, 'central-sign-clean')
        .setDisplaySize(124, 72);

    signContainer.add(signSprite);

    // 3. Smooth floating hover animation
    this.tweens.add({
        targets: signContainer,
        y: 171,
        duration: 1150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}


    createBaseWalls() {
        // Tighten astronaut's physics hitbox to their boots so they don't snag on doorways
        this.player.body.setSize(160, 140);
        this.player.body.setOffset(120, 220);

        // Create a static physics group for all solid base walls & obstacles
        const walls = this.physics.add.staticGroup();

        const addWall = (x, y, width, height) => {
            const wall = this.add.rectangle(x, y, width, height, 0xff0000, 0); // Change 0 to 0.3 to debug visually!
            this.physics.add.existing(wall, true);
            walls.add(wall);
        };

        // --- 1. CENTRAL COMMAND TABLE ---
        addWall(400, 300, 160, 90);

        // --- 2. OUTER PERIMETER BOUNDARIES (Keep inside the 4 wings) ---
        addWall(400, 48, 800, 36);   // Top outer ceiling wall
        addWall(400, 560, 800, 84);  // Bottom outer floor wall
        addWall(36, 300, 74, 600);   // Left outer wall
        addWall(764, 320, 74, 600);  // Right outer wall

        // --- 3. EXTERIOR GAPS BETWEEN THE 4 WINGS (Martian dirt pockets) ---
        addWall(400, 108, 130, 86);  // Top center gap (between Oxygen & Water wings)
        addWall(400, 505, 140, 180);  // Bottom center gap (between Power & Airlock wings)
        addWall(82, 300, 265, 96);   // Middle-left gap (between Oxygen & Power wings)
        addWall(718, 300, 265, 96);  // Middle-right gap (between Water & Airlock wings)

        // --- 4. INTERIOR BULKHEADS & HEAVY EQUIPMENT ---
        addWall(115, 140, 95, 75);   // Oxygen green tanks (top-left corner)
        addWall(665, 135, 130, 75);  // Water blue tanks (top-right corner)
        addWall(105, 420, 75, 110);  // Power reactor coils (bottom-left corner)
        addWall(705, 485, 85, 75);   // Airlock outer door bulkhead (bottom-right)

        // Enable collision between the astronaut and all base walls
        this.physics.add.collider(this.player, walls);
    }

    onSimulationTick() {
        if (this.gameEnded) return;

        this.envState.tickCount++;

        // Day/Night Cycle: 6 ticks (24s) DAY, 4 ticks (16s) NIGHT = 10 ticks per Sol
        const cyclePos = this.envState.tickCount % 12;
        const wasDay = this.envState.isDay;
        this.envState.isDay = cyclePos < 8;

        if (cyclePos === 0) {
            this.envState.sol++;
            if (this.envState.sol > 5) {
                this.endMission(true, 'MISSION ACCOMPLISHED! You survived 5 Martian Sols!');
                return;
            }
            this.prompt.setText(`SOL ${this.envState.sol} DAWN: Sunrise! Solar panels back online.`);
        } else if (wasDay && !this.envState.isDay) {
            this.prompt.setText('NIGHTFALL (-80°C): Solar power offline! Check Heater mode [H].');
        }

        // Visual room tint for Day vs Night
        //this.baseRoom.setFillStyle(this.envState.isDay ? 0x26384a : 0x131d2b);
        // Night vs Day lighting on the background Image
        if (this.isNight) { // (keep whatever condition variable your line 214 already uses!)
            this.baseRoom.setTint(0x64748b); // Dims the base artwork cleanly for night
        } else {
            this.baseRoom.clearTint();       // Restores full bright colors during the day
        }

        // Base crew consumption every tick
        this.survival.oxygen = Math.max(0, this.survival.oxygen - 2);
        this.survival.water = Math.max(0, this.survival.water - 2);

        // Radiation fluctuation (lower at night when sun is down!)
        const roll = Math.random();
        if (!this.envState.isDay) {
            this.envState.radiation = Number((Math.random() * 0.08).toFixed(2));
        } else if (roll < 0.45) {
            this.envState.radiation = Number((Math.random() * 0.09).toFixed(2));
        } else if (roll < 0.8) {
            this.envState.radiation = Number((0.11 + Math.random() * 0.38).toFixed(2));
        } else {
            this.envState.radiation = Number((0.6 + Math.random() * 7.5).toFixed(2));
        }

        // Dust storm cycle
        const storms = new Array('LIGHT', 'MODERATE', 'EXTREME');
        if (Math.random() < 0.35) {
            this.envState.dustLevel = storms[Math.floor(Math.random() * storms.length)];
        }

        // TRADE-OFF 1: Solar Panel Power vs. Dust Storm Damage & Night Cycle
        if (this.envState.panelsOpen) {
            if (!this.envState.isDay) {
                // Night: Open panels produce 0 power, but still risk extreme dust storm damage!
                if (this.envState.dustLevel === 'EXTREME') {
                    this.survival.power = Math.max(0, this.survival.power - 8);
                    this.prompt.setText('ALERT: Extreme night dust storm damaging OPEN solar panels!');
                }
            } else if (this.envState.dustLevel === 'LIGHT') {
                this.survival.power = Math.min(100, this.survival.power + 3);
            } else if (this.envState.dustLevel === 'MODERATE') {
                // Moderate storm generates less power (+1) while risking wear
                this.survival.power = Math.min(100, this.survival.power + 1);
            } else if (this.envState.dustLevel === 'EXTREME') {
                this.survival.power = Math.max(0, this.survival.power - 8);
                this.prompt.setText('ALERT: Extreme dust storm damaging OPEN solar panels!');
            }
        } else {
            // Retracted panels are safe from dust, but generate 0 power
            this.survival.power = Math.max(0, this.survival.power - 1);
        }

        // TRADE-OFF 2: Habitat Heater HIGH vs ECO Mode (especially critical at Night)
        if (this.envState.heaterHigh) {
            const powerCost = this.envState.isDay ? 2 : 4;
            this.survival.power = Math.max(0, this.survival.power - powerCost);
        } else {
            // ECO mode saves power, but cold stress drains Oxygen at night
            if (!this.envState.isDay) {
                this.survival.oxygen = Math.max(0, this.survival.oxygen - 3);
            }
        }

        this.refreshAllHuds();
        this.checkGameOver();
    }

    refreshAllHuds() {
        this.hud.setText(this.getHudText());
        this.solHud.setText(this.getSolHudText());
        this.solHud.setColor(this.envState.isDay ? '#facc15' : '#38bdf8');
        this.envHud.setText(this.getEnvHudText());
    }

    getHudText() {
        return `OXYGEN: ${this.survival.oxygen}
WATER:  ${this.survival.water}
POWER:  ${this.survival.power}`;
    }

    getSolHudText() {
        const phase = this.envState.isDay ? 'DAYTIME (SOLAR ACTIVE)' : 'NIGHT (-80°C | NO SOLAR)';
        return `SOL ${this.envState.sol} / 5\n${phase}`;
    }

    getEnvHudText() {
        const sv = this.envState.radiation;
        const radZone = sv <= 0.1 ? 'SAFE' : sv <= 0.5 ? 'CAUTION' : 'UNSAFE';
        const panels = this.envState.panelsOpen ? 'OPEN' : 'RETRACTED';
        const heater = this.envState.heaterHigh ? 'HIGH' : 'ECO';
        return `RADIATION: ${sv.toFixed(2)} Sv (${radZone})
DUST STORM: ${this.envState.dustLevel}
PANELS: ${panels} | HEATER: ${heater}`;
    }

    showTaskBriefing(config, onStartTask) {
        this.activePuzzle = { isBriefing: true };
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
        }

        const ui = [];
        const addObj = (obj) => {
            obj.setDepth(150);
            ui.push(obj);
            return obj;
        };

        addObj(
            this.add.rectangle(400, 300, 800, 600, 0x050811, 0.82)
                .setInteractive()
        );

        const neilPortrait = addObj(
            this.add.image(155, 310, 'astronaut').setScale(0.32)
        );

        const bobTween = this.tweens.add({
            targets: neilPortrait,
            y: 303,
            angle: { from: -2, to: 2 },
            duration: 480,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        addObj(
            this.add.rectangle(505, 300, 460, 290, 0x131926, 0.98)
                .setStrokeStyle(3, config.accentHex)
        );
        addObj(
            this.add.rectangle(505, 178, 460, 38, config.accentHex, 0.2)
        );
        addObj(
            this.add.text(505, 178, config.title, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: config.accentColor,
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        addObj(
            this.add.text(298, 218, 'SPACE STATION FACT:', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#94a3b8',
                fontStyle: 'bold'
            })
        );

        const pageText = addObj(
            this.add.text(298, 244, '', {
                fontSize: '15px',
                fontFamily: 'monospace',
                color: '#fef08a',
                stroke: '#000000',
                strokeThickness: 0,
                wordWrap: { width: 415 },
                lineSpacing: 6
            })
        );
        const pageIndicator = addObj(
            this.add.text(505, 377, '', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#94a3b8'
            }).setOrigin(0.5)
        );

        const startBtn = addObj(
            this.add.rectangle(585, 415, 185, 34, config.accentHex)
                .setInteractive({ useHandCursor: true })
        );
        const startBtnText = addObj(
            this.add.text(585, 415, '', {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#090d16',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );

        const cancelBtn = addObj(
            this.add.rectangle(390, 415, 140, 34, 0x1e293b)
                .setStrokeStyle(2, 0x64748b)
                .setInteractive({ useHandCursor: true })
        );
        addObj(
            this.add.text(390, 415, 'CANCEL [ESC]', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#cbd5e1',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );

        let pageIndex = 0;
        const renderPage = () => {
            pageText.setText(config.pages[pageIndex]);
            pageIndicator.setText(`INFO ${pageIndex + 1} / ${config.pages.length}`);
            startBtnText.setText(
                pageIndex === config.pages.length - 1 ? 'START TASK >>' : 'CONTINUE >>'
            );
        };

        const cleanup = () => {
            bobTween.stop();
            window.removeEventListener('keydown', keyHandler);
            ui.forEach(obj => {
                if (obj && obj.destroy) obj.destroy();
            });
        };

        const launch = () => {
            cleanup();
            this.activePuzzle = null;
            onStartTask();
        };

        const cancel = () => {
            cleanup();
            this.activePuzzle = null;
        };

        const continueBriefing = () => {
            if (pageIndex < config.pages.length - 1) {
                pageIndex++;
                renderPage();
            } else {
                launch();
            }
        };

        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                continueBriefing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        };

        renderPage();
        startBtn.on('pointerdown', continueBriefing);
        cancelBtn.on('pointerdown', cancel);
        window.addEventListener('keydown', keyHandler);
    }


    startRepairPuzzle(system) {
        if (system === 'oxygen') {
            try {
                this.activePuzzle = new O2FilterPuzzle(
                    this,
                    () => {
                        this.survival.oxygen = Math.min(100, this.survival.oxygen + 15);
                        this.refreshAllHuds();
                    },
                    () => {
                        this.activePuzzle = null;
                    }
                );
            } catch (err) {
                console.error('O2FilterPuzzle error:', err);
                this.activePuzzle = null;
            }
        } else if (system === 'water') {
            try {
                this.activePuzzle = new WaterPipePuzzle(
                    this,
                    () => {
                        this.survival.water = Math.min(100, this.survival.water + 15);
                        this.refreshAllHuds();
                    },
                    () => {
                        this.activePuzzle = null;
                    }
                );
            } catch (err) {
                console.error('WaterPipePuzzle error:', err);
                this.activePuzzle = null;
            }
        } else if (system === 'power') {
            try {
                this.activePuzzle = new PowerWiringPuzzle(
                    this,
                    () => {
                        this.survival.power = Math.min(100, this.survival.power + 15);
                        this.refreshAllHuds();
                    },
                    () => {
                        this.activePuzzle = null;
                    }
                );
            } catch (err) {
                console.error('PowerReactor error:', err);
                this.activePuzzle = null;
            }
        }
    }

    checkGameOver() {
        if (this.survival.oxygen <= 0) {
            this.endMission(false, 'MISSION FAILED: Outpost Oxygen depleted!');
        } else if (this.survival.water <= 0) {
            this.endMission(false, 'MISSION FAILED: Outpost Water reserves depleted!');
        } else if (this.survival.power <= 0) {
            this.endMission(false, 'MISSION FAILED: Outpost Power grid collapsed!');
        }
    }

    endMission(victory, reason) {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.player.body.setVelocity(0, 0);

        this.add.rectangle(400, 300, 800, 600, 0x020617, 0.92).setDepth(200);
        this.add.rectangle(400, 300, 560, 260, 0x1e293b)
            .setStrokeStyle(3, victory ? 0x22c55e : 0xef4444)
            .setDepth(201);

        this.add.text(400, 235, victory ? 'MISSION COMPLETE' : 'CRITICAL SYSTEM FAILURE', {
            fontSize: '28px',
            color: victory ? '#22c55e' : '#ef4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);

        this.add.text(400, 285, reason, {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5).setDepth(202);

        this.add.text(400, 330, `Final Stats — O2: ${this.survival.oxygen} | Water: ${this.survival.water} | Power: ${this.survival.power}`, {
            fontSize: '14px',
            color: '#94a3b8'
        }).setOrigin(0.5).setDepth(202);

        const restartBtn = this.add.rectangle(400, 385, 200, 42, 0x0284c7)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(202);

        this.add.text(400, 385, 'PLAY AGAIN', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(203);

        restartBtn.on('pointerdown', () => {
            this.scene.start('OutpostScene', {});
        });
    }

    // Main game loop
    update() {
        if (this.activePuzzle || this.gameEnded) return;

        // Instant Trade-Off Hotkey [H]: Toggle Habitat Heater HIGH vs ECO
        if (Phaser.Input.Keyboard.JustDown(this.keys.H)) {
            this.envState.heaterHigh = !this.envState.heaterHigh;
            this.refreshAllHuds();

            if (this.envState.heaterHigh) {
                this.prompt.setText('HEATER SET TO HIGH: Crew warm (O2 safe), higher Power drain.');
                this.tradeoffBar.setText('[H] Heater: HIGH (Safe O2, -Power)   |   [C] Electrolysis: -15 Water & -10 Power -> +20 O2');
            } else {
                this.prompt.setText('HEATER SET TO ECO: Power saved, but cold nights drain O2!');
                this.tradeoffBar.setText('[H] Heater: ECO (Saves Power, -O2 at night)   |   [C] Electrolysis: -15 Water & -10 Power -> +20 O2');
            }
        }


        // Instant Trade-Off Hotkey [C]: ECLSS Water-to-Oxygen Electrolysis
        if (Phaser.Input.Keyboard.JustDown(this.keys.C)) {
            if (this.survival.water >= 20 && this.survival.power >= 15) {
                this.survival.water -= 15;
                this.survival.power -= 10;
                this.survival.oxygen = Math.min(100, this.survival.oxygen + 20);
                this.refreshAllHuds();
                this.prompt.setText('ELECTROLYSIS COMPLETE: Converted -15 Water & -10 Power into +20 OXYGEN!');
            } else {
                this.prompt.setText('ELECTROLYSIS LOCKED: Need at least 20 Water and 15 Power.');
            }
        }

        let dx = 0;
        let dy = 0;

        // Player movement
        if (this.cursors.left.isDown || this.keys.A.isDown) dx--;
        if (this.cursors.right.isDown || this.keys.D.isDown) dx++;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy--;
        if (this.cursors.down.isDown || this.keys.S.isDown) dy++;

        const direction = new Phaser.Math.Vector2(dx, dy)
            .normalize()
            .scale(180);

        this.player.body.setVelocity(
            direction.x,
            direction.y
        );

        // Find nearby station
        const station = this.stations.find(s =>
            Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                s.x,
                s.y
            ) < (s.system === 'command' ? 110 : 75)
        );

        // Display interaction prompt when near a station
        if (station) {
            if (station.system === 'airlock') {
                this.prompt.setText('Press E for AIRLOCK (EVA costs -5 O2 airlock cycle | Manage Solar Panels)');
            } else if (station.system === 'command') {
                this.prompt.setText('Press E to access CENTRAL INFORMATION');
            } else {
                this.prompt.setText(`Press E to repair ${station.name} (+15 ${station.name})`);
            }
        }

        // Handle station interaction
        if (
            station &&
            Phaser.Input.Keyboard.JustDown(this.keys.E)
        ) {
            this.player.body.setVelocity(0, 0);

            if (
                station.system === 'oxygen' ||
                station.system === 'water' ||
                station.system === 'power'
            ) {
                this.showTaskBriefing(
                    TASK_BRIEFINGS[station.system],
                    () => this.startRepairPuzzle(station.system)
                );
            } else if (station.system === 'airlock') {
                try {
                    this.activePuzzle = new AirlockEnvPanel(
                        this,
                        this.envState,
                        () => {
                            this.envState.panelsOpen = !this.envState.panelsOpen;
                            this.refreshAllHuds();
                        },
                        () => {
                            // Airlock depressurization cost (-5 O2) when stepping out!
                            this.survival.oxygen = Math.max(0, this.survival.oxygen - 5);
                            this.activePuzzle = null;
                            this.scene.start('SurfaceScene', {
                                survival: this.survival,
                                envState: this.envState
                            });
                        },
                        () => {
                            this.activePuzzle = null;
                        }
                    );
                } catch (err) {
                    console.error('AirlockEnvPanel error:', err);
                    this.activePuzzle = null;
                }
                        } else if (station.system === 'airlock') {
                try {
                    this.activePuzzle = new AirlockEnvPanel(
                        this,
                        this.envState,
                        () => {
                            this.envState.panelsOpen = !this.envState.panelsOpen;
                            this.refreshAllHuds();
                        },
                        () => {
                            // Airlock depressurization cost (-5 O2) when stepping out!
                            this.survival.oxygen = Math.max(0, this.survival.oxygen - 5);
                            this.activePuzzle = null;
                            this.scene.start('SurfaceScene', {
                                survival: this.survival,
                                envState: this.envState
                            });
                        },
                        () => {
                            this.activePuzzle = null;
                        }
                    );
                } catch (err) {
                    console.error('AirlockEnvPanel error:', err);
                    this.activePuzzle = null;
                }
            } else if (station.system === 'command') {
                try {
                    this.activePuzzle = new CommandTerminal(
                        this,
                        () => {
                            this.activePuzzle = null;
                        }
                    );
                } catch (err) {
                    console.error('CommandTerminal error:', err);
                    this.activePuzzle = null;
                }
            }
        }
    }
}