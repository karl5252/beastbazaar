// game/ui/UiButton.js
export class UiButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cfg) {
        super(scene, x, y);

        const {
            color = 'yellow',     // Button color (yellow, orange, teal, etc.)
            size = 'm',           // Preferred size: 's', 'm', 'l'
            text = '',
            textStyle = {},
            onClick
        } = cfg;

        // Build the sprite key based on color and size
        const spriteKey = `btn_${color}_${size}`;

        // Use simple sprite from loaded image
        this.bg = scene.add.sprite(0, 0, spriteKey);
        this.bg.setOrigin(0.5);

        // Calculate if we need to scale the button
        // (Only if text is too wide for the button)
        const tempText = scene.add.text(0, 0, text, {
            fontFamily: 'Nunito',
            fontSize: '24px',
            fontWeight: '700',
            ...textStyle
        });

        const textWidth = tempText.width;
        tempText.destroy(); // Just measuring, don't need it

        // Check if text fits with padding (80% of button width)
        const availableWidth = this.bg.width * 0.8;
        let scale = 1;

        if (textWidth > availableWidth) {
            // Calculate needed scale (max 1.2x)
            const neededScale = Math.min(1.2, (textWidth + 40) / this.bg.width);
            scale = neededScale;
            this.bg.setScale(scale);
        }

        // Create the label
        this.label = scene.add.text(0, 0, text, {
            fontFamily: 'Nunito',
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            ...textStyle
        }).setOrigin(0.5);

        this.add([this.bg, this.label]);

        // Set container size based on scaled sprite
        this.setSize(this.bg.displayWidth, this.bg.displayHeight);

        this.setInteractive(
            new Phaser.Geom.Rectangle(
                -this.bg.displayWidth / 2,
                -this.bg.displayHeight / 2,
                this.bg.displayWidth,
                this.bg.displayHeight
            ),
            Phaser.Geom.Rectangle.Contains
        );

        this.enabled = true;
        this.baseScale = scale; // Store base scale for animations
        this._bindInput(scene, onClick);
    }

    _bindInput(scene, onClick) {
        const down = {sx: 1.02, sy: 0.94, yOff: 2};
        const over = {sx: 1.05, sy: 1.05};
        this._pressedOff = 0;

        this.on('pointerover', () => {
            if (!this.enabled) return;
            scene.tweens.add({
                targets: this,
                scaleX: this.baseScale * over.sx,
                scaleY: this.baseScale * over.sy,
                duration: 90
            });
        });

        this.on('pointerout', () => {
            this.y -= this._pressedOff;
            this._pressedOff = 0;
            scene.tweens.add({
                targets: this,
                scaleX: this.baseScale,
                scaleY: this.baseScale,
                duration: 90
            });
        });

        this.on('pointerdown', () => {
            if (!this.enabled) return;
            this.y += down.yOff;
            this._pressedOff = down.yOff;
            scene.tweens.add({
                targets: this,
                scaleX: this.baseScale * down.sx,
                scaleY: this.baseScale * down.sy,
                duration: 60
            });
        });

        this.on('pointerup', () => {
            if (!this.enabled) return;
            this.y -= this._pressedOff;
            this._pressedOff = 0;
            scene.tweens.add({
                targets: this,
                scaleX: this.baseScale * over.sx,
                scaleY: this.baseScale * over.sy,
                duration: 80,
                onComplete: () => onClick && onClick()
            });
        });
    }

    setEnabled(flag) {
        this.enabled = !!flag;
        this.alpha = this.enabled ? 1 : 0.55;
        return this;
    }

    // Helper to update text (useful for dynamic content)
    setText(newText) {
        this.label.setText(newText);
        return this;
    }
}