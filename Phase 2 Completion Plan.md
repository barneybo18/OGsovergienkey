# Phase 2 Completion Plan — Sovereign Agent Keys

Last updated: 2026-04-15

## Goal
Complete Phase 2: wire real 0G Storage uploads, 0G DA logging, ZK proof execution, and reliable on‑chain registration with low risk.

## High-level Steps
1. Prep & Safety: env handling, local testnet, and docs.
2. Implement real 0G Storage upload in `ai-orchestrator`.
3. Implement real 0G DA logging in `ai-orchestrator`.
4. Deploy contracts locally and add a Hardhat deploy script.
5. Build the ZK guest ELF and run the prover (SP1).
6. Integrate prover into `ai-orchestrator` (produce proof + public inputs).
7. Add on‑chain calls from orchestrator: `registerAgent` and `logIntent`.
8. Replace fragile `exec` spawn in `mission-control` with robust API.
9. Test, instrument, and harden (retries, timeouts, structured logs).
10. Deploy to 0G testnet (only after local green).

## Detailed Tasks

### 1) Prep & Safety
- Add `.env.example` for `ai-orchestrator` and `contracts`.
- Update `contracts/hardhat.config.ts` to load `PRIVATE_KEY` from `.env`.
- Add README notes listing required env vars and testnet faucet steps.
- Use local Hardhat for initial tests.

### 2) 0G Storage (Replace mocks)
- File: `ai-orchestrator/src/0g-service.ts`
- Replace mock `uploadEncryptedMPCShard` with SDK `upload` call.
- Read `RPC_ENDPOINT`, `STORAGE_NODE_URL`, `INDEXER_URL`, `PRIVATE_KEY` from env.
- Add retry/backoff and validate returned root hash.

### 3) 0G DA logging
- File: `ai-orchestrator/src/0g-service.ts`
- Replace `logIntentMemory` mock with real DA upload via SDK/indexer.
- Include metadata: `agentId`, `timestamp`, `intentHash`.
- Return DA root and confirm retrievable.

### 4) Local contract deploy & script
- Add `contracts/scripts/deploy.ts` to deploy `MockZKVerifier` then `AgentRegistry`.
- Update `hardhat.config.ts` to use `.env`.
- Commands:
  - `npx hardhat node`
  - `npx hardhat run scripts/deploy.ts --network localhost`
- Save deployed addresses in README.

### 5) Build ZK guest ELF & run prover
- Install SP1 toolchain (sp1up) and add riscv target.
- Commands:
  - `cd zk-engine/program`
  - `cargo prove build`
  - `cd ../script`
  - `cargo run --release`
- Confirm prover prints verification and public journal values.

### 6) Integrate prover into orchestrator
- Approach: add a small CLI or subprocess interface for `zk-engine/script` that accepts JSON inputs and returns JSON `{ proof: <bytes>, pubInputs: [...] }`.
- Modify `ai-orchestrator/src/agent.ts` to call the prover with intent + constitution, capture proof & pubInputs.

### 7) On-chain flows from orchestrator
- Add ethers/v6 or viem client to `ai-orchestrator`.
- After shard upload & DA logging:
  - Call `registerAgent(pubKey, constitutionHash)` and capture `agentId`.
- After proving:
  - Call `logIntent(agentId, intentDataId, pubInputs, zkProof)`.
- Ensure contract ABI and deployed address are configurable via env.

### 8) Mission Control spawn flow
- Replace `exec` usage with:
  - Preferred: orchestrator exposes HTTP endpoint `/spawn` returning JSON with `agentId`, `rootHash`, `txHash`.
  - Short-term: ensure orchestrator prints single-line JSON and increase timeout.
- Update `mission-control/src/app/spawn-agent/route.ts` accordingly.

### 9) Testing & hardening
- Unit tests for `ZeroGService` (mock SDK).
- Integration test: orchestrator → prover → local Hardhat contract calls.
- Add structured JSON logs, retries, and clear error messages.
- Add feature flag to toggle mock vs real 0G calls.

### 10) Testnet deploy
- Acquire 0G testnet tokens from faucet.
- Deploy contracts to 0G testnet via Hardhat.
- Run one full spawn + prove + logIntent on testnet.
- Update README with contract addresses and explorer links.

## Risk Mitigation Checklist
- Always use local Hardhat until tests pass.
- Keep secrets in `.env` and `.gitignore`.
- Add feature flags to revert to mocks quickly.
- Add timeouts and exponential backoff for network ops.
- Log proof/public inputs and receipts to local file for debugging.

## Estimated Effort (rough)
- Prep & env + local deploy: 0.5–1.5 hours
- 0G SDK wiring (storage + DA): 1–3 hours
- ZK build & prover: 1–3 hours (toolchain dependent)
- Integration & on‑chain calls + testing: 2–6 hours
- Total: ~1–2 working days (depending on SP1/toolchain availability)

## Quick Commands (local)
```bash
# Contracts: compile and run local node
cd contracts
npm install
npx hardhat compile
npx hardhat node

# In another terminal: deploy locally
cd contracts
npx hardhat run scripts/deploy.ts --network localhost

# Build zk guest (requires SP1)
cd zk-engine/program
cargo prove build

# Run prover
cd zk-engine/script
cargo run --release