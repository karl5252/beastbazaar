import {Scene} from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const {width, height} = this.scale

        //  We loaded this image in our Boot Scene, so we can display it here
        //this.add.image(512, 384, 'background');

        // add a splash screen above the loading bar
        this.add.image(width / 2, height / 2, 'splash').setScale(0.5).setOrigin(0.5)
        ;

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(width / 2, height * 0.9, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(width * 0.211, height * 0.9, 4, 28, 0xffffff);

        // Update progress bar on loading progress
        this.load.on('progress', (progress) => {
            bar.width = 4 + 460 * progress
        })
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.


        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('GameScene');//'MenuScene');
    }
}
