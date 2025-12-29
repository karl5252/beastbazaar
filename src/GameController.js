// game/core/GameController.js

import {PlayerState} from "./game/core/PlayerState.js";
import {Logic} from "./game/core/Logic.js";
import {DiceRoller} from "./utils/DiceRoller.js";

export class GameController {
    constructor(config, eventEmitter) {
        // Inject Phaser's EventEmitter instead of extending
        this.events = eventEmitter;

        // Initialize players
        this.players = [];
        for (let i = 0; i < config.playerCount; i++) {
            const player = new PlayerState(config.playerNames[i], i);
            this.players.push(player);
        }

        // Initialize Logic with players and config
        this.logic = new Logic(this.players, config);
        this.config = config;

        this.diceRoller = new DiceRoller(config.difficulty);

        // Emit initial state
        this.emitSnapshot();
    }

    /**
     * Dispatch an action - the ONLY way to mutate game state
     */
    dispatch(actionFn) {
        const result = actionFn();

        if (!result.ok) {
            this.events.emit('ui:error', result);
            return result;
        }

        // Success - emit new snapshot
        this.emitSnapshot();
        return result;
    }

    /**
     * Get current public state (immutable snapshot)
     */
    getPublicState() {
        const currentPlayer = this.logic.getCurrentPlayer();

        return {
            // Game meta
            turnNumber: this.logic.turnNumber,
            currentPlayerIndex: this.logic.currentPlayerIndex,
            currentPlayerName: currentPlayer.name,

            // Turn state
            hasRolled: this.logic.turnState.hasRolled,
            hasExchanged: this.logic.turnState.hasExchanged,

            // Current player herd
            currentPlayerHerd: {...currentPlayer.getHerd()},

            // Bank state
            bankHerd: {...this.logic.bankHerd.getHerd()},

            // All players (for scoreboard/opponent view)
            players: this.players.map(p => ({
                index: p.index,
                name: p.name,
                herd: {...p.getHerd()}
            })),

            // Pending trades
            pendingTrades: this.logic.exchangeManager.getPendingRequests(
                this.logic.turnNumber,
                this.config.tradeExpiry
            ).map(req => ({
                id: req.id,
                requestorIndex: req.requestorIndex,
                requestorName: this.players[req.requestorIndex].name,
                targetIndex: req.targetIndex,
                targetName: req.targetIndex === 99
                    ? 'Bank'
                    : this.players[req.targetIndex].name,
                offer: req.offer,
                want: req.want,
                turnsLeft: this.config.tradeExpiry - (this.logic.turnNumber - req.createdTurn)
            })),

            // Config (for reference)
            config: this.config
        };
    }

    emitSnapshot() {
        const state = this.getPublicState();
        this.events.emit('game:state', state);

        // Optional: log for debugging
        if (this.config.debug) {
            console.log('[GameController] State snapshot:', state);
        }
    }

    // ===== Action Methods =====

    /**
     * Roll dice - can be called with explicit results (for UI animations)
     * or without (for auto-roll)
     */
    rollDice(greenResult = null, redResult = null) {
        return this.dispatch(() => {
            const currentPlayer = this.logic.getCurrentPlayer();

            // If no results provided, roll the dice
            const results = (greenResult && redResult)
                ? {green: greenResult, red: redResult}
                : this.diceRoller.rollBoth();

            const result = this.logic.processDiceRoll(
                currentPlayer,
                results.green,
                results.red
            );

            // Add dice results to the response for UI
            if (result.ok) {
                result.diceResults = results;
            }

            return result;
        });
    }

    exchangeWithBank(animalFrom, animalTo) {
        return this.dispatch(() => {
            return this.logic.exchangeWithBank(animalFrom, animalTo);
        });
    }

    postTradeRequest({targetIndex, offer, want}) {
        return this.dispatch(() => {
            return this.logic.postTradeRequest({targetIndex, offer, want});
        });
    }

    acceptTrade({requestId}) {
        return this.dispatch(() => {
            return this.logic.acceptTrade({requestId});
        });
    }

    rejectTrade({requestId}) {
        return this.dispatch(() => {
            const req = this.logic.exchangeManager.exchangeRequests.find(r => r.id === requestId);
            if (!req) return {ok: false, reason: 'request_not_found'};

            req.markRejected('rejected_by_target');

            // Remove rejected request from the list
            this.logic.exchangeManager.exchangeRequests =
                this.logic.exchangeManager.exchangeRequests.filter(r => r.id !== requestId);

            return {ok: true};
        });
    }

    endTurn() {
        return this.dispatch(() => {
            const result = this.logic.endTurn();

            // Show toast if trades were pruned
            if (result.tradesPruned > 0) {
                this.events.emit('ui:toast', {
                    message: result.tradesPruned === 1
                        ? 'Trade offer no longer valid!'
                        : `${result.tradesPruned} trade offers no longer valid!`,
                    type: 'warning'
                });
            }

            // Check for victory
            if (result.winnerIndex !== null) {
                this.events.emit('game:victory', {
                    winnerIndex: result.winnerIndex,
                    winnerName: this.players[result.winnerIndex].name,
                    turnNumber: this.logic.turnNumber
                });
            }

            return result;
        });
    }

    // ===== Helper Methods =====

    rollDie(color) {
        // TODO: Implement based on DiceConfig and difficulty
        const difficulty = this.config.difficulty || 'easy';

        // Placeholder - replace with actual DiceConfig logic
        const animals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse'];
        const predators = ['Fox', 'Wolf'];

        const predatorChance = difficulty === 'easy' ? 0.2 : 0.3;

        if (Math.random() < predatorChance) {
            return predators[Math.floor(Math.random() * predators.length)];
        }

        return animals[Math.floor(Math.random() * animals.length)];
    }
}