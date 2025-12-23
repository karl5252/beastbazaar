import {PlayerState} from "../../src/game/core/PlayerState.js";
import {Logic} from "../../src/game/core/Logic.js";

describe("Logic - endTurn victory detection", () => {
    let logic;
    let p1, p2;

    beforeEach(() => {
        p1 = new PlayerState("P1", 0);
        p2 = new PlayerState("P2", 1);

        logic = new Logic([p1, p2]);
        logic.startTurn();
    });

    it("should declare current player as winner when victory condition is met", () => {
        p1.updateHerd("Rabbit", 1);
        p1.updateHerd("Sheep", 1);
        p1.updateHerd("Pig", 1);
        p1.updateHerd("Cow", 1);
        p1.updateHerd("Horse", 1);

        const res = logic.endTurn();

        expect(res.winnerIndex).toBe(0);
        expect(logic.currentPlayerIndex).toBe(0);
    });
});
