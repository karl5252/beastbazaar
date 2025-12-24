// src/ui/UiButton.js
export class UiButton extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {object} cfg
     * @param {string} cfg.atlasKey      e.g. 'ui'
     * @param {string} cfg.frame         e.g. 'btn_pink'
     * @param {number} cfg.w             initial width (will autosize if autoSize=true)
     * @param {number} cfg.h             height
     * @param {number} cfg.slice         corner size (assumes uniform)
     * @param {string} cfg.text          already translated label (pass t('key'))
     * @param {object} cfg.textStyle     Phaser text style
     * @param {number} cfg.paddingX      horizontal padding for autosize
     * @param {boolean} cfg.autoSize     autosize width to text
     * @param {Function} cfg.onClick
     */
    constructor(scene, x, y, cfg) {
        super(scene, x, y);

        const {
            atlasKey,
            frame,
            w = 220,
            h = 64,
            slice = 16,
            text,
            textStyle = {},
            paddingX = 48,
            autoSize = true,
            onClick
        } = cfg;

        // Requires NineSlice plugin: scene.add.nineslice(...)
        this.bg = scene.add.nineslice(0, 0, atlasKey, frame, w, h, slice, slice, slice, slice);

        this.label = scene.add.text(0, 0, text, {
            fontFamily: 'Nunito', // swap later, but pick something rounded
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            ...textStyle
        }).setOrigin(0.5);

        this.add([this.bg, this.label]);

        // Autosize width to translated text
        if (autoSize) {
            const newW = Math.max(w, Math.ceil(this.label.width + paddingX));
            this.bg.resize(newW, h);
            this.setSize(newW, h);
        } else {
            this.setSize(w, h);
        }

        this.setInteractive(
            new Phaser.Geom.Rectangle(-this.width / 2, -this.height / 2, this.width, this.height),
            Phaser.Geom.Rectangle.Contains
        );

        this.enabled = true;
        this._bindInput(scene, onClick);
    }

    _bindInput(scene, onClick) {
        this.on('pointerover', () => {
            if (!this.enabled) return;
            scene.tweens.add({targets: this, scaleX: 1.05, scaleY: 1.05, duration: 90});
        });

        this.on('pointerout', () => {
            scene.tweens.add({targets: this, scaleX: 1, scaleY: 1, duration: 90});
        });

        this.on('pointerdown', () => {
            if (!this.enabled) return;
            scene.tweens.add({
                targets: this,
                scaleX: 0.97,
                scaleY: 0.97,
                duration: 60,
                yoyo: true,
                onComplete: () => onClick && onClick()
            });
        });
    }

    setEnabled(flag) {
        this.enabled = !!flag;
        this.alpha = this.enabled ? 1 : 0.55;
        // optional: make disabled text darker
        this.label.setAlpha(this.enabled ? 1 : 0.85);
        return this;
    }

    setText(newText, paddingX = 48) {
        this.label.setText(newText);

        // Resize to new language
        const newW = Math.max(this.bg.width, Math.ceil(this.label.width + paddingX));
        this.bg.resize(newW, this.bg.height);
        this.setSize(newW, this.bg.height);
        this.input && this.input.hitArea && this.input.hitArea.setTo(-newW / 2, -this.height / 2, newW, this.height);

        return this;
    }
}
