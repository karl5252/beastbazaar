
# Beast Bazaar

**Beast Bazaar** is a local multiplayer, turn-based strategy game inspired by classic animal-breeding board games.

The project serves as both a playable game and a **proof of concept for clean game architecture**, separating core game logic from presentation and input handling.

Built with **Phaser 3** and modern JavaScript.

Play Online: https://weeangusmcdread.itch.io/beast-bazaar

---

## Game Overview

- **Genre:** Turn-based strategy, party game  
- **Players:** 2–4 (local co-op / hotseat)  
- **Platform:** PC (Browser)  
- **Input:** Mouse / Keyboard  
- **Audio:** Not yet implemented (planned for future update)

### Objective
Be the first player to collect **at least one of each animal**:
- Rabbit
- Sheep
- Pig
- Cow
- Horse

---

## Gameplay

Each turn, a player can:

1. **Roll the dice** to breed animals  
2. **Trade** with the bank or other players  
3. **End the turn**

### Key Mechanics
- Rolling doubles grants animals based on your current herd
- Predators can wipe out parts of your herd
- Dogs protect against specific predators
- Trades expire after a configurable number of turns

Rules are inspired by classic designs, but adapted and simplified for a digital format.

---

## Architecture

This project focuses heavily on **clean separation of concerns**:

Game Logic
↓
Game Controller ↔ Game Scene (UI)


- **Logic layer**  
  Pure game rules, no rendering, no Phaser dependencies

- **GameController**  
  Acts as the single mutation gateway and event dispatcher

- **Scenes / UI**  
  Responsible only for presentation and user input

This makes the game:
- easier to test
- easier to refactor
- easier to extend or reskin

---

## Tech Stack

- **Phaser 3**
- **Vite**
- **JavaScript (ES modules)**
- Local state & event-driven updates

---

## Development Status

- Core gameplay complete  
- Local multiplayer working  
- UI implemented  
- Sound effects & music (planned)  

The game is considered **feature-complete**, with only small polish updates expected.

---

## Running Locally

```bash
npm install
npm run dev

npm run build
```

### License & Inspiration

This project is inspired by classic animal trading and breeding board games, but is an original implementation with modified rules and mechanics.

All code and assets in this repository are original unless stated otherwise.

### Notes

Beast Bazaar is intentionally small in scope.
It exists as a finished game and a reference project, not a live service.

If you’re reading this for the architecture:
that part is very much the point.
