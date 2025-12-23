import {beforeEach, describe, expect, test} from "vitest";
import {PlayerState} from "../../src/game/core/PlayerState.js";
import {setHerd} from "../helpers/helper.js";
import {EXCHANGE_RATES} from "../../src/game/constants/ExchangeRates.js";
import {exchangeWithBankAtomic} from "../../src/game/core/Logic.js";

describe("bank exchange rates (from EXCHANGE_RATES)", () => {
    let p, bank;

    beforeEach(() => {
        p = new PlayerState("P1", 0);
        bank = new PlayerState("BANK", 99);
    });

    const cases = Object.entries(EXCHANGE_RATES).map(([key, rate]) => {
        const [from, to] = key.split("->");
        return [from, to, rate.give, rate.get];
    });

    test.each(cases)("exchanges %s -> %s (give %i, get %i)", (from, to, give, get) => {
        setHerd(p, {[from]: give});
        setHerd(bank, {[to]: get});
        //console.log({ key: `${from}->${to}`, from, to, give, get, herd: p.getHerd() });

        const res = exchangeWithBankAtomic({player: p, bank, animalFrom: from, animalTo: to});
        expect(res.ok).toBe(true);

        expect(p.getHerd()[from] ?? 0).toBe(0);
        expect(p.getHerd()[to] ?? 0).toBe(get);
    });

    test.each([
        ["Rabbit", "Sheep", 5],  // brakuje 1
        ["Cow", "Horse", 1],     // brakuje 1
    ])("fails when player lacks animals: %s -> %s", (from, to, have) => {
        setHerd(p, {[from]: have});
        const res = exchangeWithBankAtomic({player: p, bank, animalFrom: from, animalTo: to});
        expect(res.ok).toBe(false);
    });

});
