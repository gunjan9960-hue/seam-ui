# Phase 4 — Risk Register

## AI Risks

| ID | Risk | Failure Point | Validation Method |
|----|------|--------------|-------------------|
| A1 | **Hallucination** — Claude states a fact not present in retrieved docs | Generation layer (Claude) | Run 20 queries, manually check each answer against source docs |
| A2 | **Wrong Retrieval** — BM25/vector surfaces irrelevant chunks for the query | Retrieval layer (BM25 + Voyage AI) | Check cited sources — do they actually answer the question? |
| A3 | **Intent Misclassification** — query tagged with wrong intent badge | Intent detection | Run one query per intent type, verify badge matches |
| A4 | **Stale Data** — right doc retrieved but content is outdated | Data freshness | Check if freshness warning fires correctly for >90 day sources |

## UX Risks

| ID | Risk | Failure Point | Validation Method |
|----|------|--------------|-------------------|
| U1 | **Trust Gap** — PM still opens all 5 sources to verify the answer | Answer self-sufficiency | Count how many answers are self-contained vs require source verification |
| U2 | **Answer Length Mismatch** — simple questions get 10-line bullets, complex ones get 2 sentences | Format detection | Check: complex query → bullets, simple query → 2–4 sentences |
| U3 | **Follow-up Suggestions Irrelevant** — suggested bubbles don't match what the user actually wants | Intent-to-suggestion mapping | After each answer, verify at least 1 of 3 suggestions is genuinely useful |

## Failure Chain

```
Query → Retrieval → Generation → Answer
         ↑             ↑            ↑
         A2            A4           A1
      (wrong doc)  (stale doc)  (hallucination)
```

UX risks (U1, U2, U3) are observable at the Answer layer regardless of where the upstream failure occurred.
