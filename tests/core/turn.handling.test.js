import {beforeEach, describe, expect, it} from "vitest";
import {Logic} from "../../src/game/core/Logic.js";
import {PlayerState} from "../../src/game/core/PlayerState.js";

describe("Logic - turn handling", () => {
    let logic;
    let p1, p2;

    beforeEach(() => {
        p1 = new PlayerState("P1", 0);
        p2 = new PlayerState("P2", 1);

        logic = new Logic([p1, p2]);
        logic.startTurn();
    });

    it("should move to next player when no one has won", () => {
        expect(logic.currentPlayerIndex).toBe(0);

        const res = logic.endTurn();

        expect(res.winnerIndex).toBe(null);
        expect(logic.currentPlayerIndex).toBe(1);
    });

});
