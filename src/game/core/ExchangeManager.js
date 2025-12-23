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
        // soft prune
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

        // Na tym etapie manager “zaakceptował” transakcję.
        // Wykonanie transferów zrobisz później w warstwie Logic, bo tu nie mamy Playerów.
        req.markAccepted();

        // Możesz usuwać accepted, żeby nie puchło:
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
            const acceptorHerd = r.target?.index !== INDEXES.BANK_INDEX9 ? herdProvider?.(r.target.index) : null;

            const v = this.validateForAccept(r, {
                acceptorIndex: r.target?.index,
                requestorHerd,
                acceptorHerd,
                // BANK walidujesz dopiero po spięciu z bankiem, więc tu go traktujemy jako “pomijamy”
                skipTargetBalanceCheck: r.target?.index === INDEXES.BANK_INDEX,
            });

            if (!v.ok) r.markInvalid(v.reason);
        }

        // Wywal śmieci:
        this.exchangeRequests = this.exchangeRequests.filter(r => r.status === "pending");
    }

    // --- walidacje ---

    validateForPosting(req, requestorHerd) {
        if (!Number.isInteger(req.targetIndex) || req.targetIndex < 0) {
            return {ok: false, reason: "bad_target"};
        }
        if (req.targetIndex === req.requestorIndex) {
            return {ok: false, reason: "self_trade"};
        }

        const basic = this.validateLegs(req);
        if (!basic.ok) return basic;

        // requestor musi mieć offer już przy tworzeniu requestu
        if (!requestorHerd) return {ok: false, reason: "missing_requestor_herd"};
        if ((requestorHerd[req.offer.animal] ?? 0) < req.offer.amount) return {
            ok: false,
            reason: "requestor_lacks_offer"
        };

        return {ok: true};
    }

    validateForAccept(req, {acceptorIndex, requestorHerd, acceptorHerd, skipTargetBalanceCheck = false}) {
        const basic = this.validateLegs(req);
        if (!basic.ok) return basic;

        if (!requestorHerd) return {ok: false, reason: "missing_requestor_herd"};
        if ((requestorHerd[req.offer.animal] ?? 0) < req.offer.amount) return {
            ok: false,
            reason: "requestor_lacks_offer"
        };

        if (req.targetIndex === req.requestorIndex) {
            if (!Number.isInteger(acceptorIndex) || acceptorIndex < 0) return {ok: false, reason: "bad_acceptor"};
            if (!acceptorHerd) return {ok: false, reason: "missing_acceptor_herd"};
            if ((acceptorHerd[req.want.animal] ?? 0) < req.want.amount) return {
                ok: false,
                reason: "acceptor_lacks_want"
            };
        } else {
            // BANK: w tej “odłączonej” wersji nie sprawdzamy stanów banku ani kursów.
            // To dojdzie po spięciu z bankiem i rules.
            if (!skipTargetBalanceCheck) {
                // placeholder
            }
        }

        return {ok: true};
    }

    validateLegs(req) {
        if (!req.offer.animal || !req.want.animal) return {ok: false, reason: "bad_animal"};
        if (req.offer.animal === req.want.animal) return {ok: false, reason: "same_animal"};
        if (!Number.isFinite(req.offer.amount) || req.offer.amount <= 0) return {ok: false, reason: "bad_offer_amount"};
        if (!Number.isFinite(req.want.amount) || req.want.amount <= 0) return {ok: false, reason: "bad_want_amount"};
        return {ok: true};
    }
}
