import Phaser from 'phaser';
import StoryBgImage from './assets/story-bg.png';
import storyBgmFile from './assets/story-bgm.mp3';

export default class StoryScene extends Phaser.Scene {

    constructor() {
        super('StoryScene');
    }

    preload() {
        // Load the story background image so 'story-bg' exists!
        if (!this.textures.exists('story-bg')) {
            this.load.image('story-bg', StoryBgImage);
        }

        if (!this.cache.audio.exists('story-bgm')) {
            this.load.audio('story-bgm', storyBgmFile);
        }
    }

    create() {
        // 3. Start looping Story BGM (handles browser autoplay restrictions)
        this.bgm = this.sound.add('story-bgm', {
            volume: 0.35,
            loop: true
        });

        if (this.sound.locked) {
            this.sound.once('unlocked', () => {
                if (this.bgm && !this.bgm.isPlaying) {
                    this.bgm.play();
                }
            });
        } else {
            this.bgm.play();
        }

        // 1. Space Station Observation Deck Background
        this.add.image(400, 300, 'story-bg').setDisplaySize(800, 600);

        // Subtle dark vignette so HUD & dialogue pop clearly
        this.add.rectangle(400, 300, 800, 600, 0x090d16, 0.25);

        // 2. Top Banner Bar (matches "FARMING CRISIS" header)
        this.add.rectangle(400, 26, 784, 38, 0x131926, 0.92)
            .setStrokeStyle(3, 0x22c55e);

        this.add.text(400, 22, 'OUTPOST: THE LAST CREW', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#22c55e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 37, 'A Mars Survival Mission', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#94a3b8'
        }).setOrigin(0.5);

        // 3. Top-Right "SKIP >>" Button
        const skipBg = this.add.rectangle(748, 72, 76, 28, 0x2d1e18, 0.92)
            .setStrokeStyle(2, 0x94a3b8)
            .setInteractive({ useHandCursor: true });

        const skipText = this.add.text(748, 72, 'SKIP >>', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        skipBg.on('pointerover', () => skipBg.setStrokeStyle(2, 0x22c55e));
        skipBg.on('pointerout', () => skipBg.setStrokeStyle(2, 0x94a3b8));
        skipBg.on('pointerdown', () => this.startGame());

        // 4. Center Alert Monitor Card (shown during crisis slides)
        this.alertCard = this.add.container(400, 255).setVisible(false);

        const cardFrame = this.add.rectangle(0, 0, 310, 185, 0x090d16, 0.95)
            .setStrokeStyle(4, 0x22c55e);

        const cardInnerBorder = this.add.rectangle(0, 0, 318, 193, 0x000000, 0)
            .setStrokeStyle(3, 0xb4532a);

        // Red warning header inside card
        const alertHeader = this.add.rectangle(0, -68, 280, 26, 0xef4444);
        this.alertHeaderText = this.add.text(0, -68, '▲ CRITICAL SYSTEM ALERT ▲', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Visual schematic inside the alert monitor
        this.alertVisualText = this.add.text(0, 12, '', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#f87171',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        this.alertCard.add([
            cardInnerBorder,
            cardFrame,
            alertHeader,
            this.alertHeaderText,
            this.alertVisualText
        ]);

        // 5. Astronaut "Neil" on Bottom-Left with Idle Bobbing
        this.neil = this.add.image(185, 505, 'astronaut').setScale(0.24);

        this.tweens.add({
            targets: this.neil,
            y: 498,
            angle: { from: -2, to: 2 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 6. Dialogue Box (Bottom-Center, matches Henry's box)
        const dialogueBox = this.add.rectangle(465, 515, 370, 108, 0x131926, 0.94)
            .setStrokeStyle(3, 0x22c55e)
            .setInteractive({ useHandCursor: true });

        // Green "NEIL" Name Tag
        this.add.rectangle(332, 474, 72, 22, 0x22c55e);
        this.add.text(332, 474, 'NEIL', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#090d16',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Story Dialogue Text
        this.dialogueText = this.add.text(296, 494, '', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ffffff',
            wordWrap: { width: 340 },
            lineSpacing: 6
        });

        // Blinking "• CLICK TO CONTINUE •"
        const continuePrompt = this.add.text(465, 554, '• CLICK TO CONTINUE •', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#22c55e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: continuePrompt,
            alpha: 0.3,
            duration: 550,
            yoyo: true,
            repeat: -1
        });

        // 7. Storyline Script
        this.storySlides = [
            {
                text: 'Hello, I am Neil! Commander of Mars Outpost Ares-4.',
                showAlert: false
            },
            {
                text: 'A massive solar storm just struck the habitat, and our life support is failing...',
                showAlert: true,
                alertTitle: '▲ LIFE SUPPORT FAILURE ▲',
                alertBody: 'OXYGEN FILTERS : CLOGGED [60%]\nWATER RECYCLER : LEAKING [60%]\nREACTOR GRID   : UNSTABLE [60%]'
            },
            {
                text: 'We must survive 5 Sols until the rescue shuttle arrives from orbit.',
                showAlert: true,
                alertTitle: '▲ MISSION OBJECTIVE ▲',
                alertBody: '1. Clean O2 Filters & Fix Pipes\n2. Brave the Airlock for EVA Crystals\n3. Keep All Systems Above 0%'
            },
            {
                text: 'Suit up! Let’s head into the outpost and stabilize the base.',
                showAlert: false
            }
        ];

        this.currentSlide = 0;
        this.showSlide(0);

        // Advance dialogue on click, Space, or Enter
        dialogueBox.on('pointerdown', () => this.nextSlide());
        this.input.on('pointerdown', (pointer) => {
            // Ignore clicks on the SKIP button
            if (pointer.x > 700 && pointer.y < 95) return;
            this.nextSlide();
        });
        this.input.keyboard.on('keydown-SPACE', () => this.nextSlide());
        this.input.keyboard.on('keydown-ENTER', () => this.nextSlide());
    }

    showSlide(index) {
        const slide = this.storySlides[index];
        this.dialogueText.setText(slide.text);

        if (slide.showAlert) {
            this.alertCard.setVisible(true);
            this.alertHeaderText.setText(slide.alertTitle);
            this.alertVisualText.setText(slide.alertBody);
        } else {
            this.alertCard.setVisible(false);
        }
    }

    nextSlide() {
        this.currentSlide++;
        if (this.currentSlide < this.storySlides.length) {
            this.showSlide(this.currentSlide);
        } else {
            this.startGame();
        }
    }

    startGame() {
        // Stop Story BGM when entering the Outpost (remove these 4 lines if you want it to keep playing!)
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }

        this.input.keyboard.off('keydown-SPACE');
        this.input.keyboard.off('keydown-ENTER');
        this.scene.start('OutpostScene');
    }
}
