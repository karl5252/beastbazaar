import {beforeEach, describe, expect, it} from "vitest";
import {INDEXES} from "../../src/game/constants/Constants.js";
import {ExchangeManager} from "../../src/game/core/ExchangeManager.js";
import {PlayerState} from "../../src/game/core/PlayerState.js";
import {setHerd} from "../helpers/helper.js";

describe("ExchangeManager - Edge Cases", () => {
    let em;
    let p1, p2, p3;
    const BANK_INDEX = INDEXES.BANK_INDEX;

    beforeEach(() => {
        em = new ExchangeManager();
        p1 = new PlayerState("Player1", 0);
        p2 = new PlayerState("Player2", 1);
        p3 = new PlayerState("Player3", 2);
    });

    describe("pruneInvalidRequests", () => {
        it("should remove only invalid and expired requests", () => {
            setHerd(p1, {Sheep: 20, Cow: 5});
            setHerd(p2, {Rabbit: 30, Pig: 10});
            setHerd(p3, {Horse: 2});

            // Create multiple requests
            const req1 = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 5},
                want: {animal: "Rabbit", amount: 10},
                createdTurn: 4,
                requestorHerd: p1.getHerd()
            });

            em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p3.index,
                offer: {animal: "Cow", amount: 2},
                want: {animal: "Horse", amount: 1},
                createdTurn: 4,
                requestorHerd: p1.getHerd()
            });

            em.postRequest({
                requestorIndex: p2.index,
                targetIndex: p1.index,
                offer: {animal: "Pig", amount: 5},
                want: {animal: "Sheep", amount: 3},
                createdTurn: 0,
                requestorHerd: p2.getHerd()
            });

            expect(em.exchangeRequests).toHaveLength(3);

            // Invalidate req2 by removing p1's cows
            setHerd(p1, {Sheep: 20, Cow: 0});

            // Let req3 expire
            em.pruneInvalidRequests({
                currentTurn: 5,
                expiryTurns: 3,
                herdProvider: (idx) => {
                    if (idx === 0) return p1.getHerd();
                    if (idx === 1) return p2.getHerd();
                    if (idx === 2) return p3.getHerd();
                    return null;
                }
            });

            // Only req1 should remain (it's still valid)
            expect(em.exchangeRequests).toHaveLength(1);
            expect(em.exchangeRequests[0].id).toBe(req1.requestId);
        });

        it("should skip target balance check for bank exchanges", () => {
            setHerd(p1, {Rabbit: 10});

            const req = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: BANK_INDEX,
                offer: {animal: "Rabbit", amount: 6},
                want: {animal: "Sheep", amount: 1},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            expect(req.ok).toBe(true);

            // Prune with no bank herd provider - should still be valid
            em.pruneInvalidRequests({
                currentTurn: 1,
                expiryTurns: 10,
                herdProvider: (idx) => idx === 0 ? p1.getHerd() : null
            });

            expect(em.exchangeRequests).toHaveLength(1);
            expect(em.exchangeRequests[0].status).toBe("pending");
        });
    });

    describe("executeExchange", () => {
        it("should successfully transfer animals between players", () => {
            setHerd(p1, {Sheep: 10});
            setHerd(p2, {Rabbit: 20});

            em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 3},
                want: {animal: "Rabbit", amount: 12},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            const request = em.exchangeRequests[0];
            const result = em.executeExchange(request, p1, p2);

            expect(result.ok).toBe(true);
            expect(p1.getHerd().Sheep).toBe(7);
            expect(p1.getHerd().Rabbit).toBe(12);
            expect(p2.getHerd().Rabbit).toBe(8);
            expect(p2.getHerd().Sheep).toBe(3);
        });

        it("should fail if transfer cannot complete", () => {
            setHerd(p1, {Sheep: 3});
            setHerd(p2, {Rabbit: 20});

            const req = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 3},
                want: {animal: "Rabbit", amount: 12},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            expect(req.ok).toBe(true);

            setHerd(p1, {Sheep: 2});

            const request = em.exchangeRequests[0];
            const result = em.executeExchange(request, p1, p2);

            expect(result.ok).toBe(false);
            expect(result.reason).toBe("transfer_failed");
        });
    });

    describe("self-trade prevention", () => {
        it("should reject requests where requestor and target are the same", () => {
            setHerd(p1, {Sheep: 10});

            const res = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p1.index, // Same player!
                offer: {animal: "Sheep", amount: 5},
                want: {animal: "Rabbit", amount: 10},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            expect(res.ok).toBe(false);
            expect(res.reason).toBe("self_trade");
        });
    });

    describe("same animal prevention", () => {
        it("should reject requests where offer and want are the same animal", () => {
            setHerd(p1, {Sheep: 10});

            const res = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 5},
                want: {animal: "Sheep", amount: 3}, // Same animal!
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            expect(res.ok).toBe(false);
            expect(res.reason).toBe("same_animal");
        });
    });

    describe("concurrent request handling", () => {
        it("should handle multiple valid requests from different players", () => {
            setHerd(p1, {Sheep: 20});
            setHerd(p2, {Rabbit: 30});
            setHerd(p3, {Cow: 10});

            const req1 = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 5},
                want: {animal: "Rabbit", amount: 10},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            const req2 = em.postRequest({
                requestorIndex: p2.index,
                targetIndex: p3.index,
                offer: {animal: "Rabbit", amount: 8},
                want: {animal: "Cow", amount: 2},
                createdTurn: 0,
                requestorHerd: p2.getHerd()
            });

            const req3 = em.postRequest({
                requestorIndex: p3.index,
                targetIndex: p1.index,
                offer: {animal: "Cow", amount: 3},
                want: {animal: "Sheep", amount: 4},
                createdTurn: 0,
                requestorHerd: p3.getHerd()
            });

            expect(em.exchangeRequests).toHaveLength(3);
            expect(req1.ok).toBe(true);
            expect(req2.ok).toBe(true);
            expect(req3.ok).toBe(true);
        });

        it("should handle conflicting requests correctly", () => {
            setHerd(p1, {Sheep: 10});
            setHerd(p2, {Rabbit: 20});

            // Both players want to trade with each other
            const req1 = em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 8},
                want: {animal: "Rabbit", amount: 15},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            const req2 = em.postRequest({
                requestorIndex: p2.index,
                targetIndex: p1.index,
                offer: {animal: "Rabbit", amount: 18},
                want: {animal: "Sheep", amount: 9},
                createdTurn: 0,
                requestorHerd: p2.getHerd()
            });

            expect(req1.ok).toBe(true);
            expect(req2.ok).toBe(true);

            // Accept the first one
            const accept1 = em.acceptRequest({
                requestId: req1.requestId,
                acceptorIndex: p2.index,
                currentTurn: 1,
                expiryTurns: 10,
                requestorHerd: p1.getHerd(),
                acceptorHerd: p2.getHerd()
            });

            expect(accept1.ok).toBe(true);
            em.executeExchange(accept1.request, p1, p2);

            // Now p1 doesn't have enough sheep for req2
            const accept2 = em.acceptRequest({
                requestId: req2.requestId,
                acceptorIndex: p1.index,
                currentTurn: 1,
                expiryTurns: 10,
                requestorHerd: p2.getHerd(),
                acceptorHerd: p1.getHerd()
            });

            expect(accept2.ok).toBe(false);
            expect(accept2.reason).toBe("requestor_lacks_offer");
        });
    });

    describe("expiry edge cases", () => {
        it("should handle expiry=0 (immediate expiry)", () => {
            setHerd(p1, {Sheep: 10});

            em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 5},
                want: {animal: "Rabbit", amount: 10},
                createdTurn: 5,
                requestorHerd: p1.getHerd()
            });

            const pending = em.getPendingRequests(5, 0);
            expect(pending).toHaveLength(0); // Expired immediately
        });

        it("should handle expiry=-1 (never expire)", () => {
            setHerd(p1, {Sheep: 10});

            em.postRequest({
                requestorIndex: p1.index,
                targetIndex: p2.index,
                offer: {animal: "Sheep", amount: 5},
                want: {animal: "Rabbit", amount: 10},
                createdTurn: 0,
                requestorHerd: p1.getHerd()
            });

            const pending = em.getPendingRequests(1000, -1);
            expect(pending).toHaveLength(1); // Never expires
        });
    });
});