import {Scene} from 'phaser';
import {initI18n} from "../utils/i18n.js";


export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.
        //this.load.image('background', 'assets/background.png');
        this.load.image('splash', 'assets/splash_screen_cute.png');
        initI18n()
    }

    create() {
        Promise.all([
            document.fonts.load('400 16px "Nunito"'),
            document.fonts.load('700 16px "Nunito"')
        ]).then(() => {
            logger.log('[fonts] Nunito ready:', document.fonts.check('16px "Nunito"'));
            this.scene.start('Preloader');
        });

        this.scene.start('Preloader');
    }
}
