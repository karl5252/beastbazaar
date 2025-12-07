# SURF-BOY: Phaser 3 + Vite.js Starter
A wave-themed arcade game built with Phaser 3 and modern frontend tooling.


SURF-BOY is a retro-inspired side-scroller where you ride the waves, dodge beach hazards, and hurl crabs at flying fish. Built for the Itch.io Game Jam, this project uses a streamlined Phaser 3 + Vite.js template for fast iteration and smooth deployment.

## Prerequisites
To get started, you'll need:

Node.js and npm

Recommended: nvm (Node Version Manager) For Windows: nvm-windows

Install Node.js and npm with nvm:

```bash
nvm install node
nvm use node
```
Windows users can replace node with latest.

## Getting Started
Clone the template or scaffold with degit:

```bash
npx degit https://github.com/ourcade/phaser3-vite-template surf-boy
cd surf-boy
npm install
````
Start the development server:

```bash
npm run start
```
Build for production:

```bash
npm run build
```
Your game will be bundled into the dist/ folder—ready to upload to itch.io or any web host.

## Project Structure
```
surf-boy/
├── dist/              ← Production build output
├── node_modules/      ← Dependencies
├── public/            ← Static assets (images, music, sfx)
├── src/               ← Game code
│   ├── GameScene.js  ← Example scene
│   ├── main.js             ← Entry point
├── index.html         ← Main HTML file
├── package.json       ← Project metadata & scripts
```
Place your game logic in src/

Static assets like sprites, music, and sound effects go in public/

main.js bootstraps Phaser and loads your first scene

## Asset Loading
Assets in public/ are served from the root. Example:

```
public/
├── images/
│   └── crab.png
├── music/
│   └── surf-theme.mp3
├── sfx/
│   └── splash.wav
Load them in Phaser like this:
```
```js
this.load.image('crab', 'images/crab.png');
this.load.audio('surf-theme', 'music/surf-theme.mp3');
```
## ESLint
Basic linting is included to help catch common bugs. Customize rules via .eslintrc or check ESLint docs.

## Dev Server Port
Change the default port (8000) in vite.config.js:

```js
server: { host: '0.0.0.0', port: 8080 }
```
## License
MIT License — free to use, remix, and ship. 