// game/ui/UiButton.js
export class UiButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cfg) {
        super(scene, x, y);

        const {
            color = 'yellow',     // Button color
            size = 'm',           // Button size: 's', 'm', 'l'
            text = '',            // Text label
            icon = null,          // Icon sprite key (e.g., 'icon_dice')
            iconScale = 1,        // Icon scaling
            textStyle = {},
            onClick
        } = cfg;

        // Build the sprite key
        const spriteKey = `btn_${color}_${size}`;

        // Background sprite
        this.bg = scene.add.sprite(0, 0, spriteKey);
        this.bg.setOrigin(0.5);

        this.children = [this.bg];

        // Add icon if provided (dominant, centered-top)
        if (icon) {
            this.icon = scene.add.sprite(0, -15, icon);
            this.icon.setOrigin(0.5);
            this.icon.setScale(iconScale);
            this.children.push(this.icon);
        }

        // Add text label (smaller, below icon)
        if (text) {
            const yOffset = icon ? 20 : 0; // Move down if there's an icon

            this.label = scene.add.text(0, yOffset, text, {
                fontFamily: 'Nunito',
                fontSize: icon ? '18px' : '24px', // Smaller if there's icon
                fontWeight: '700',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3,
                ...textStyle
            }).setOrigin(0.5);

            this.children.push(this.label);
        }

        this.add(this.children);

        // Set container size
        this.setSize(this.bg.width, this.bg.height);

        this.setInteractive(
            new Phaser.Geom.Rectangle(
                -this.bg.width / 2,
                -this.bg.height / 2,
                this.bg.width,
                this.bg.height
            ),
            Phaser.Geom.Rectangle.Contains
        );

        this.enabled = true;
        this.baseScale = 1;
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

    setHighlighted(flag) {
        this.highlighted = !!flag;

        if (this.highlighted) {
            // Add a colored border/glow effect
            if (this.bg) {
                this.bg.setTint(0xffff99); // Light yellow tint
            }
        } else {
            // Remove tint
            if (this.bg) {
                this.bg.clearTint();
            }
        }

        return this;
    }

    setText(newText) {
        if (this.label) {
            this.label.setText(newText);
        }
        return this;
    }
}