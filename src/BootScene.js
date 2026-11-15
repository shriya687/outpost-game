import Phaser from 'phaser';
import astronautImage from './assets/astronaut-reference.png';
import outpostBgImage from './assets/outpost_bg.png';
import surfaceBgImage from './assets/surface-bg.png';

export default class BootScene extends Phaser.Scene {

    constructor() {
        super('BootScene');
    }

    preload() {
        // 1. Deep dark-navy background matching your screenshot (#0d1124)
        this.cameras.main.setBackgroundColor('#0d1124');

        // 2. Load all game textures during the loading screen
        this.load.image('astronaut', astronautImage);
        this.load.image('outpost-bg', outpostBgImage);
        this.load.image('surface-bg', surfaceBgImage);

        // 3. Small astronaut icon on the left of the title
        this.add.image(255, 286, 'astronaut').setScale(0.08);

        // 4. Bright neon-green pixel title text
        this.add.text(415, 286, 'OUTPOST: THE LAST CREW', {
            fontSize: '20px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#00ff33',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 5. Centered "Loading..." subtitle below the title
        this.loadingText = this.add.text(400, 326, 'Loading...', {
            fontSize: '14px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#00cc29'
        }).setOrigin(0.5);

        // Optional: Update dots ("Loading.", "Loading..", "Loading...")
        let dots = 0;
        this.dotTimer = this.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => {
                dots = (dots + 1) % 4;
                this.loadingText.setText('Loading' + '.'.repeat(dots));
            }
        });
    }

    create() {
        // Brief pause (900ms) so the player actually sees the retro loading screen
        // even when local assets load instantaneously
        //this.time.delayedCall(3000, () => {
        //    if (this.dotTimer) this.dotTimer.remove();
        //    this.scene.start('OutpostScene');
        //});
        this.time.delayedCall(3000, () => {
        if (this.dotTimer) this.dotTimer.remove();
        this.scene.start('StoryScene');
        });

    }
}
