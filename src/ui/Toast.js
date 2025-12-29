// game/ui/Toast.js
export class Toast {
    static show(scene, message, type = 'info') {
        const {width, height} = scene.cameras.main;
        const x = width / 2;
        const y = height - 100;

        // Color based on type
        const colors = {
            info: 0x4a90e2,
            success: 0x5cb85c,
            warning: 0xf0ad4e,
            error: 0xd9534f
        };

        const bgColor = colors[type] || colors.info;

        // Background
        const bg = scene.add.rectangle(x, y, 400, 60, bgColor, 0.95)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0xffffff);

        // Message text
        const text = scene.add.text(x, y, message, {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            align: 'center',
            wordWrap: {width: 360}
        }).setOrigin(0.5);

        // Container for both
        const container = scene.add.container(0, 0, [bg, text]);
        container.setDepth(1000); // Above everything

        // Entrance animation
        container.setAlpha(0);
        container.y += 30;

        scene.tweens.add({
            targets: container,
            alpha: 1,
            y: container.y - 30,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Auto-dismiss after 3 seconds
        scene.time.delayedCall(3000, () => {
            scene.tweens.add({
                targets: container,
                alpha: 0,
                y: container.y + 20,
                duration: 200,
                ease: 'Power2',
                onComplete: () => container.destroy()
            });
        });

        return container;
    }
}