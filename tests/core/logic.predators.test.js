import {Player} from "../../src/game/core/Player.js";
import {Logic} from "../../src/game/core/Logic.js";
import {setHerd} from "../helpers/helper.js";

describe("predators logic tests", () => {
    let player;
    let logic;

    beforeEach(() => {
        player = new Player();
        logic = new Logic();
    });
    it("test rule if player has no foxhound and rolls fox he loses all rabbits ONLY", () => {
        setHerd(player, {Rabbit: 1, Sheep: 1, Pig: 1, Cow: 1, Horse: 1, Wolfhound: 1});
        setHerd(logic.bankHerd, {Rabbit: 59});

        logic.processDiceRoll(player, "Rabbit", "Fox");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0, // lost rabbits
            "Sheep": 1,
            "Pig": 1,
            "Cow": 1,
            "Horse": 1,
            "Foxhound": 0,
            "Wolfhound": 1
        });
    })

    it("test rule if player has foxhound and rolls fox he loses one foxhound ONLY", () => {
        setHerd(player, {Rabbit: 1, Sheep: 1, Pig: 1, Cow: 1, Horse: 1, Foxhound: 1, Wolfhound: 1});

        logic.processDiceRoll(player, "Sheep", "Fox");
        expect(player.getHerd()).toEqual({
            "Rabbit": 1,
            "Sheep": 1,
            "Pig": 1,
            "Cow": 1,
            "Horse": 1,
            "Foxhound": 0, // lost one foxhound
            "Wolfhound": 1
        });
    })

    it("test rule if player has no wolfhound and rolls wolf he loses all animals except hounds and horse", () => {
        setHerd(player, {Rabbit: 1, Sheep: 1, Pig: 1, Cow: 1, Horse: 1, Foxhound: 1});
        setHerd(logic.bankHerd, {Rabbit: 59, Sheep: 23, Pig: 19, Cow: 11});


        logic.processDiceRoll(player, "Cow", "Wolf");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0, // lost
            "Sheep": 0,  // lost
            "Pig": 0,    // lost
            "Cow": 0,    // lost
            "Horse": 1,
            "Foxhound": 1,
            "Wolfhound": 0
        });
    })

    it("test rule if player has wolfhound and rolls wolf he loses one wolfhound ONLY", () => {
        setHerd(player, {Rabbit: 1, Sheep: 1, Pig: 1, Cow: 1, Horse: 1, Wolfhound: 1, Foxhound: 1});

        logic.processDiceRoll(player, "Pig", "Wolf");
        expect(player.getHerd()).toEqual({
            "Rabbit": 1,
            "Sheep": 1,
            "Pig": 1,
            "Cow": 1,
            "Horse": 1,
            "Foxhound": 1,
            "Wolfhound": 0 // lost one wolfhound
        });
    })

    it("test rule if player has no animals and rolls fox and wolf herd remains unchanged", () => {
        logic.processDiceRoll(player, "Fox", "Wolf");
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

    it("test rule if player has some animals and rolls fox and wolf only the relevant animals are affected", () => {
        setHerd(player, {Rabbit: 1, Sheep: 1, Pig: 1, Cow: 1, Horse: 1});
        setHerd(logic.bankHerd, {Rabbit: 59, Sheep: 23, Pig: 19, Cow: 11});

        logic.processDiceRoll(player, "Fox", "Wolf");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0, // lost rabbits
            "Sheep": 0,  // lost sheep
            "Pig": 0,    // lost pigs
            "Cow": 0,    // lost cows
            "Horse": 1,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

});
