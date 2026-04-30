# 📋 SAK Phase 2 — Project Status

> Sovereign Agent Keys (SAK) on the 0G Galileo Testnet
> Branch: `prime` | Repo: `barneybo18/OGsovergienkey`

---

## ✅ Completed Work

### Session: April 17–18, 2026
- Migrated all references from **0G Newton Testnet → 0G Galileo Testnet**
- Fixed Mission Control dashboard UI: updated network label from Newton to Galileo
- Updated `.env` to use correct Galileo RPC and Turbo indexer endpoints
- Discovered `SP1_PROVER=cpu` was hardcoded in `agent.ts` — refactored to read from `.env`
- Switched to `SP1_PROVER=network` to prevent WSL RAM exhaustion (SIGKILL exit 9)

---

### Session: April 19, 2026
- Fixed `SP1_PROVER=network` panic (exit 101) — requires Succinct API key which we don't have yet
- Switched to `SP1_PROVER=mock` for pipeline demo stability
- Fixed ZK engine `main.rs`: mock proofs have no cryptographic content — added guard to skip `client.verify()` in mock mode (was panicking with `Core(Empty core proof)`)
- Added graceful fallback for 0G Storage offline — pipeline pivots to local-only mode instead of crashing
- Added `report.md`: auto-appended spawn log per pipeline execution (success and failure)
- Full pipeline ran end-to-end for the first time ✅

---

### Session: April 25, 2026 — **Major Milestone**
- **Root cause found for storage failure:** project was using `@0glabs/0g-ts-sdk` v0.2.9 (Newton-era, dead) instead of `@0gfoundation/0g-ts-sdk` v1.2.6 (Galileo-era)
- Removed Newton SDK, installed Galileo SDK
- **Fixed storage upload:** raw payload was only 85 bytes — Flow contract minimum was not met. Added structured metadata padding to both MPC shard and DA intent payloads (now 730–900+ bytes)
- Fixed TypeScript type errors: new SDK's `upload()` returns `{ txHash, rootHash, txSeq }` object, not a plain string
- **Added `waitForReceipt()` resilient RPC helper** in `agent.ts`:
  - The Galileo dev RPC (`evmrpc-testnet.0g.ai`) occasionally returns `-32000` instead of `null` for unconfirmed txs
  - ethers.js v6 treats `-32000` as a hard error and throws immediately
  - Helper catches this, switches to manual `provider.getTransactionReceipt()` polling (75 attempts × 4s = 5 min max)
- Added `.env.example` for collaborator onboarding
- **First fully successful end-to-end pipeline run** with 4 real Galileo on-chain transactions:
  1. MPC Shard → 0G Storage (real TX)
  2. Agent registration on `AgentRegistry` contract (real TX)
  3. AI Intent → 0G DA storage (real TX)
  4. Intent settlement via `AgentRegistry.logIntent` (real TX)
- Pushed to `barneybo18/OGsovergienkey` branch `prime`

---

## ⚠️ Pipeline Status: ~67% Real

| Component | Status | Notes |
|---|---|---|
| 0G Chain Settlement | ✅ Real | Galileo Chain ID: 16602 |
| 0G Storage Upload | ✅ Real | Turbo indexer, Flow contract confirmed |
| 0G DA Intent Log | ✅ Real | Galileo DA nodes responding |
| ZK Proof (SP1) | ⚠️ Mock | See TODO below |

---

## 🔲 TODO — Remaining Work

### Priority 1: Real ZK Proof (Completes the 100%)
- [ ] Register at [succinct.xyz](https://succinct.xyz) to get a **Succinct Prover Network API key**
- [ ] Add `SP1_PRIVATE_KEY=<your_key>` to `.env`
- [ ] Change `SP1_PROVER=network` in `.env`
- [ ] Test: the proof will be generated on Succinct's cloud servers and returned as a real STARK proof
- [ ] Verify the proof passes `client.verify()` in `zk-engine/script/src/main.rs` (the mock guard will auto-skip in non-mock mode)

### Priority 2: Production RPC
- [ ] The current dev RPC (`evmrpc-testnet.0g.ai`) is flagged by 0G docs as **not for production**
- [ ] Register for a dedicated RPC via [QuickNode](https://www.quicknode.com/chains/0g), [Ankr](https://www.ankr.com/rpc/0g/), or [dRPC](https://drpc.org/chainlist/0g-galileo-testnet-rpc)
- [ ] Update `RPC_ENDPOINT` in `.env` once obtained

### Priority 3: Polish
- [ ] Update `report.md` logging in `agent.ts` to include real root hashes and TX hashes in the success entry (currently only logs agent name/ID)
- [ ] Add `.env.example` to the repo root (not just `ai-orchestrator/`) for clarity

---

## 🔑 Key Contract Addresses (0G Galileo Testnet)

| Contract | Address |
|---|---|
| AgentRegistry | `0x04D25632b0bAb33FD1C77c4eA9d591c4765F3aF5` |
| 0G Storage Flow | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| 0G DA Entrance | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |

## 🔗 Useful Links

- [0G Docs](https://docs.0g.ai)
- [Galileo Chain Explorer](https://chainscan-galileo.0g.ai)
- [Galileo Storage Explorer](https://storagescan-galileo.0g.ai)
- [Succinct Prover Network](https://succinct.xyz)
- [0G Faucet](https://faucet.0g.ai)
