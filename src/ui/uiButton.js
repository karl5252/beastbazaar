export class UiButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cfg) {
        super(scene, x, y);

        const {
            key,
            w = 220,
            h = 64,
            slice = 16,
            text = '',
            textStyle = {},
            paddingX = 48,
            autoSize = true,
            onClick
        } = cfg;


        this.bg = scene.add.nineslice(0, 0, w, h, key, [slice, slice, slice, slice]);
        this.bg.setOrigin(0.5);

        this.label = scene.add.text(0, 0, text, {
            fontFamily: 'Nunito',
            fontSize: '24px',
            fontWeight: '400' | '700',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            ...textStyle
        }).setOrigin(0.5);

        this.add([this.bg, this.label]);

        // autosize width for translations if desired
        if (autoSize) {
            const newW = Math.max(w, Math.ceil(this.label.width + paddingX));
            // RenderTexture: use setSize + redraw approach (depends on plugin)
            this.bg.setSize(newW, h);
            // many RenderTexture-based nineslice plugins need a "resize" or "update" call.
            // If yours exposes bg.resize(w,h), use that instead.
            if (typeof this.bg.resize === 'function') this.bg.resize(newW, h);

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
        const down = {sx: 1.02, sy: 0.94, yOff: 2};
        const over = {sx: 1.05, sy: 1.05};
        this._pressedOff = 0;

        this.on('pointerover', () => {
            if (!this.enabled) return;
            scene.tweens.add({targets: this, scaleX: over.sx, scaleY: over.sy, duration: 90});
        });

        this.on('pointerout', () => {
            this.y -= this._pressedOff;
            this._pressedOff = 0;
            scene.tweens.add({targets: this, scaleX: 1, scaleY: 1, duration: 90});
        });

        this.on('pointerdown', () => {
            if (!this.enabled) return;
            this.y += down.yOff;
            this._pressedOff = down.yOff;
            scene.tweens.add({targets: this, scaleX: down.sx, scaleY: down.sy, duration: 60});
        });

        this.on('pointerup', () => {
            if (!this.enabled) return;
            this.y -= this._pressedOff;
            this._pressedOff = 0;
            scene.tweens.add({
                targets: this,
                scaleX: over.sx,
                scaleY: over.sy,
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
}
