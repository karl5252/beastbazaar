import {PlayerState} from "../../src/game/core/PlayerState.js";
import {ExchangeManager} from "../../src/game/core/ExchangeManager.js";
import {setHerd} from "../helpers/helper.js";

describe("exchange manager logic", () => {

    let em;
    let p1;
    let p2;
    const BANK_INDEX = 99;

    beforeEach(() => {
        em = new ExchangeManager();
        p1 = new PlayerState("FarmerOne", 0);
        p2 = new PlayerState("FarmerTwo", 1);
    });

    it("Test that a player can post an exchange request", () => {
        setHerd(p1, {Sheep: 11});
        const res = em.postRequest({
            requestorIndex: p1.index,
            targetIndex: p2.index,
            offer: {animal: "Sheep", amount: 11},
            want: {animal: "Rabbit", amount: 2},
            createdTurn: 0,
            requestorHerd: p1.getHerd()
        });

        expect(res.ok).toBe(true);
        expect(em.exchangeRequests).toHaveLength(1);

    });

    it("Test that a player cannot post an exchange request if they do not have the required animals", () => {
        setHerd(p1, {Horse: 0});
        const res = em.postRequest({
            requestorIndex: p1.index,
            targetIndex: p2.index,
            offer: {animal: "Horse", amount: 2},
            want: {animal: "Rabbit", amount: 22},
            createdTurn: 0,
            requestorHerd: p1.getHerd()
        });
        expect(res.ok).toBe(false);
        expect(em.exchangeRequests).toHaveLength(0);

    })

    it("Test that requests are marked as expired after N turns", () => {
        const currentTurn = 1;
        const expiryTurn = 2;

        setHerd(p1, {Sheep: 11});
        em.postRequest({
            requestorIndex: p1.index,
            targetIndex: p2.index,
            offer: {animal: "Sheep", amount: 11},
            want: {animal: "Rabbit", amount: 2},
            createdTurn: 0,
            requestorHerd: p1.getHerd()
        });

        // view and see its pending
        em.getPendingRequests(currentTurn, expiryTurn);
        expect(em.exchangeRequests.at(0).status.toLowerCase()).toEqual("pending");
        // now view in expiry turn to see its expired
        em.getPendingRequests(expiryTurn, expiryTurn);
        expect(em.exchangeRequests.at(0).status.toLowerCase()).toEqual("expired");

    })

    it("Test that a player can accept an exchange request", () => {
        setHerd(p1, {Sheep: 11});
        setHerd(p2, {Cow: 11});
        const turn = 1;
        const expiry = 2;

        const res = em.postRequest({
            requestorIndex: p1.index,
            targetIndex: p2.index,
            offer: {animal: "Sheep", amount: 11},
            want: {animal: "Cow", amount: 2},
            createdTurn: 0,
            requestorHerd: p1.getHerd()
        });
        //console.log(em.exchangeRequests);
        console.log("p1", p1.getHerd());
        console.log("p2", p2.getHerd());

        const acc = em.acceptRequest({
            requestId: res.requestId,
            acceptorIndex: p2.index,
            currentTurn: turn,
            expiryTurn: expiry,
            requestorHerd: p1.getHerd(),
            acceptorHerd: p2.getHerd()
        })
        expect(acc.ok).toBe(true);
        expect(acc.request.status).toBe("accepted");
        expect(em.exchangeRequests).toHaveLength(0);

    })

    it("Test exchange requests invalidation")
})