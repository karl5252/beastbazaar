import {Player} from "../../src/game/core/Player.js";
import {setHerd} from "../helpers/helper.js";

describe("player test", () => {
    let player;

    beforeEach(() => {
        player = new Player("testPlayer", 0); // <-- przypisanie, nie deklaracja
    });

    it("get players herd", () => {
        expect(player.getHerd()).toEqual({
            "Rabbit": 0,
            "Sheep": 0,
            "Pig": 0,
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

    it("update players herd", () => {
        setHerd(player, {Sheep: 11});

        expect(player.getHerd()["Sheep"]).toBe(11)
    })
})