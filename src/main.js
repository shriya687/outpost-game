
import Phaser from 'phaser';
import BootScene from './BootScene.js';
import StoryScene from './StoryScene.js';
import OutpostScene from './OutpostScene.js';
import SurfaceScene from './SurfaceScene.js';
import './style.css';

const game = new Phaser.Game({

    type: Phaser.AUTO,

    parent: 'game',

    width: 800,
    height: 600,

    pixelArt: true,

    backgroundColor: '#101827',

    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    scene: [BootScene, StoryScene,OutpostScene, SurfaceScene],

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }

});

