// core/ExchangeManager.js

import {ExchangeRequest} from "./ExchangeRequest.js";
import {INDEXES} from "../constants/Constants.js";

export class ExchangeManager {
    constructor() {
        this.exchangeRequests = [];
    }

    postRequest({requestorIndex, targetIndex, offer, want, createdTurn, requestorHerd}) {
        const req = new ExchangeRequest({requestorIndex, targetIndex, offer, want, createdTurn});

        const v = this.validateForPosting(req, requestorHerd);
        if (!v.ok) return {ok: false, reason: v.reason};

        this.exchangeRequests.push(req);
        return {ok: true, requestId: req.id};
    }

    getPendingRequests(currentTurn, expiryTurns) {
        // Soft prune - mark expired requests but don't remove them yet
        this.exchangeRequests.forEach(r => {
            if (r.status !== "pending") return;
            if (r.isExpired(currentTurn, expiryTurns)) r.markExpired();
        });

        return this.exchangeRequests.filter(r => r.status === "pending");
    }

    acceptRequest({requestId, acceptorIndex, currentTurn, expiryTurns, requestorHerd, acceptorHerd}) {
        const req = this.exchangeRequests.find(r => r.id === requestId);
        if (!req) return {ok: false, reason: "request_not_found"};
        if (req.status !== "pending") return {ok: false, reason: "not_pending"};

        if (req.isExpired(currentTurn, expiryTurns)) {
            req.markExpired();
            return {ok: false, reason: "expired"};
        }

        const v = this.validateForAccept(req, {acceptorIndex, requestorHerd, acceptorHerd});
        if (!v.ok) {
            req.markInvalid(v.reason);
            return {ok: false, reason: v.reason};
        }

        // At this point the manager has "accepted" the transaction.
        // Actual transfer execution happens in the Logic layer since it needs PlayerState objects.
        req.markAccepted();

        // Remove accepted requests to prevent memory bloat
        this.exchangeRequests = this.exchangeRequests.filter(r => r.id !== req.id);

        return {ok: true, request: req};
    }

    pruneInvalidRequests({currentTurn, expiryTurns, herdProvider}) {
        // herdProvider: (playerIndex) => herdObject
        for (const r of this.exchangeRequests) {
            if (r.status !== "pending") continue;

            if (r.isExpired(currentTurn, expiryTurns)) {
                r.markExpired();
                continue;
            }

            const requestorHerd = herdProvider?.(r.requestorIndex);
            const acceptorHerd = r.targetIndex !== INDEXES.BANK_INDEX
                ? herdProvider?.(r.targetIndex)
                : null;

            const v = this.validateForAccept(r, {
                acceptorIndex: r.targetIndex,
                requestorHerd,
                acceptorHerd,
                // Skip target balance check for bank - bank exchanges are validated at execution time
                skipTargetBalanceCheck: r.targetIndex === INDEXES.BANK_INDEX,
            });

            if (!v.ok) r.markInvalid(v.reason);
        }

        // Remove all non-pending requests
        this.exchangeRequests = this.exchangeRequests.filter(r => r.status === "pending");
    }

    // --- Validation methods ---

    validateForPosting(req, requestorHerd) {
        if (!Number.isInteger(req.targetIndex) || req.targetIndex < 0) {
            return {ok: false, reason: "bad_target"};
        }
        if (req.targetIndex === req.requestorIndex) {
            return {ok: false, reason: "self_trade"};
        }

        const basic = this.validateLegs(req);
        if (!basic.ok) return basic;

        // Requestor must have the offered animals when creating the request
        if (!requestorHerd) return {ok: false, reason: "missing_requestor_herd"};
        if ((requestorHerd[req.offer.animal] ?? 0) < req.offer.amount) {
            return {ok: false, reason: "requestor_lacks_offer"};
        }

        return {ok: true};
    }

    validateForAccept(req, {acceptorIndex, requestorHerd, acceptorHerd, skipTargetBalanceCheck = false}) {
        const basic = this.validateLegs(req);
        if (!basic.ok) return basic;

        // Requestor must still have the animals they're offering
        if (!requestorHerd) return {ok: false, reason: "missing_requestor_herd"};
        if ((requestorHerd[req.offer.animal] ?? 0) < req.offer.amount) {
            return {ok: false, reason: "requestor_lacks_offer"};
        }

        // FIXED: Validate acceptor when target is NOT the requestor (player-to-player trade)
        if (req.targetIndex !== req.requestorIndex) {
            if (!Number.isInteger(acceptorIndex) || acceptorIndex < 0) {
                return {ok: false, reason: "bad_acceptor"};
            }

            // For player-to-player trades, verify acceptor has what's needed
            if (!skipTargetBalanceCheck) {
                if (!acceptorHerd) return {ok: false, reason: "missing_acceptor_herd"};
                if ((acceptorHerd[req.want.animal] ?? 0) < req.want.amount) {
                    return {ok: false, reason: "acceptor_lacks_want"};
                }
            }
        }
        // Note: Bank exchanges (targetIndex === BANK_INDEX) are validated separately
        // at execution time since bank state and exchange rates need to be checked together

        return {ok: true};
    }

    validateLegs(req) {
        if (!req.offer.animal || !req.want.animal) {
            return {ok: false, reason: "bad_animal"};
        }
        if (req.offer.animal === req.want.animal) {
            return {ok: false, reason: "same_animal"};
        }
        if (!Number.isFinite(req.offer.amount) || req.offer.amount <= 0) {
            return {ok: false, reason: "bad_offer_amount"};
        }
        if (!Number.isFinite(req.want.amount) || req.want.amount <= 0) {
            return {ok: false, reason: "bad_want_amount"};
        }
        return {ok: true};
    }

    /**
     * Execute the actual transfer of animals between players
     * Called after validation passes
     */
    executeExchange(request, requestorPlayer, acceptorPlayer) {
        const success1 = requestorPlayer.transfer_animal(
            acceptorPlayer,
            request.offer.animal,
            request.offer.amount
        );

        const success2 = acceptorPlayer.transfer_animal(
            requestorPlayer,
            request.want.animal,
            request.want.amount
        );

        return success1 && success2
            ? {ok: true}
            : {ok: false, reason: "transfer_failed"};
    }
}