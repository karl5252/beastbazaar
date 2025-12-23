import {describe, expect, it} from "vitest";
import {checkVictoryCondition} from "../../src/game/core/Logic.js";
import {PlayerState} from "../../src/game/core/PlayerState.js";

describe("Victory condition", () => {
    it("returns true when player has all required animals", () => {
        const p = new PlayerState("Winner", 0);

        p.updateHerd("Rabbit", 1);
        p.updateHerd("Sheep", 1);
        p.updateHerd("Pig", 1);
        p.updateHerd("Cow", 1);
        p.updateHerd("Horse", 1);

        expect(checkVictoryCondition(p)).toBe(true);
    });

    it("returns false when player is missing an animal", () => {
        const p = new PlayerState("Loser", 0);
        p.updateHerd("Rabbit", 1);

        expect(checkVictoryCondition(p)).toBe(false);
    });
});
