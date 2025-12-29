// game/ui/GameMenuModal.js
import {Modal} from "./Modal.js";
import {UiButton} from "./UiButton.js";
import {t} from "../utils/i18n.js";

export class GameMenuModal extends Modal {
    constructor(scene) {
        super(scene, {
            width: 500,
            height: 400,
            title: t('game_menu_title') || 'Game Menu',
            showCloseButton: true,
            onClose: () => console.log('[GameMenuModal] Closed')
        });

        this.createMenuOptions();
    }

    createMenuOptions() {
        const y = -80;
        const spacing = 100;

        // Music Toggle Button
        this.musicBtn = new UiButton(this.scene, 0, y, {
            color: 'violet',
            size: 'm',
            icon: 'icon_settings',
            iconScale: 0.10,
            text: this.getMusicButtonText(),
            textStyle: {fontSize: '20px'},
            onClick: () => this.toggleMusic()
        });
        this.scene.add.existing(this.musicBtn);
        this.addContent(this.musicBtn);

        // Return to Main Menu Button
        const mainMenuBtn = new UiButton(this.scene, 0, y + spacing, {
            color: 'orange',
            size: 'm',
            text: t('game_return_to_menu') || 'Return to Main Menu',
            textStyle: {fontSize: '20px'},
            onClick: () => this.returnToMainMenu()
        });
        this.scene.add.existing(mainMenuBtn);
        this.addContent(mainMenuBtn);

        // Resume Game Button
        const resumeBtn = new UiButton(this.scene, 0, y + spacing * 2, {
            color: 'green',
            size: 'm',
            text: t('game_resume') || 'Resume Game',
            textStyle: {fontSize: '20px'},
            onClick: () => this.close()
        });
        this.scene.add.existing(resumeBtn);
        this.addContent(resumeBtn);
    }

    getMusicButtonText() {
        // Check if music is playing (we'll implement this)
        const musicEnabled = this.scene.registry.get('musicEnabled') ?? true;
        return musicEnabled
            ? (t('game_music_on') || 'Music: ON')
            : (t('game_music_off') || 'Music: OFF');
    }

    toggleMusic() {
        const currentState = this.scene.registry.get('musicEnabled') ?? true;
        const newState = !currentState;

        this.scene.registry.set('musicEnabled', newState);

        // Update button text
        this.musicBtn.setText(this.getMusicButtonText());

        // Toggle music (we'll implement sound system later)
        if (this.scene.sound && this.scene.sound.get('bgMusic')) {
            if (newState) {
                this.scene.sound.get('bgMusic').play();
            } else {
                this.scene.sound.get('bgMusic').pause();
            }
        }

        console.log('[GameMenuModal] Music toggled:', newState);
    }

    returnToMainMenu() {
        console.log('[GameMenuModal] Returning to main menu');

        // Confirm dialog
        const confirmed = confirm(
            t('game_confirm_quit') || 'Are you sure you want to quit? Current game progress will be lost.'
        );

        if (confirmed) {
            this.close();

            // Small delay to let modal close
            this.scene.time.delayedCall(200, () => {
                // Stop any music
                if (this.scene.sound) {
                    this.scene.sound.stopAll();
                }

                // Return to menu scene
                this.scene.scene.start('MenuScene');
            });
        }
    }
}