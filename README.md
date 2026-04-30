# Sovereign Agent Keys (SAK) — Phase 2

> **AI agents with cryptographic sovereignty on the 0G Galileo Testnet**

[![Network](https://img.shields.io/badge/Network-0G%20Galileo%20Testnet-blue)](https://chainscan-galileo.0g.ai)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-16602-green)](https://evmrpc-testnet.0g.ai)
[![ZK](https://img.shields.io/badge/ZK%20Prover-snarkjs%20Groth16-purple)](https://github.com/iden3/snarkjs)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

Sovereign Agent Keys (SAK) is a multi-module full-stack system that gives AI agents cryptographic sovereignty. Instead of stuffing private keys into centralised `.env` files — a massive attack surface in the emerging machine economy — SAK:

- **Shards keys** using Multi-Party Computation (MPC)
- **Enforces agent behaviour** through Zero-Knowledge proofs (circom + snarkjs Groth16 circuit)
- **Anchors everything** to 0G Labs' decentralised storage and DA infrastructure

Built for the **0G Labs APAC Hackathon (Akon's Quest)**.

---

## Pipeline Status

> **~67% Real on Galileo Testnet** — 4 out of 5 steps produce real on-chain transactions per spawn

| Stage | Status | Notes |
|---|---|---|
| MPC Shard → 0G Storage | ✅ Real | Turbo indexer, Flow contract `0x22E0...` |
| Agent Registration on-chain | ✅ Real | AgentRegistry contract on Chain 16602 |
| AI Intent → 0G DA | ✅ Real | Real Galileo DA nodes |
| Final Settlement on-chain | ✅ Real | `AgentRegistry.logIntent()` TX confirmed |
| ZK Proof (Groth16) | ⚠️ Local | circom + snarkjs Groth16 — see [TODO](status.md) |

---

## Architecture

| Module | Stack | Role |
|---|---|---|
| `contracts/` | Solidity + Hardhat | On-chain Agent Registry and ZK Verifier interface deployed to 0G EVM |
| `zk-engine/` | circom + snarkjs (Groth16) | Zero-Knowledge proving circuit that validates agent intent against its Constitution |
| `ai-orchestrator/` | TypeScript + `@0gfoundation/0g-ts-sdk` | Agent brain: formulates intents, uploads shards to 0G Storage, logs memory to 0G DA |
| `mission-control/` | Next.js 16 + Tailwind | Frontend dashboard for spawning agents, monitoring ZK status, and viewing intent logs |

---

## Repository Structure

```
OGsovergienkey/
├── contracts/                   # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── AgentRegistry.sol    # Core registry + intent logger
│   │   ├── interfaces/
│   │   │   └── IZKVerifier.sol
│   │   └── mock/
│   │       └── MockZKVerifier.sol
│   ├── hardhat.config.ts
│   └── package.json
├── zk-engine/                   # circom + snarkjs: Groth16 ZK proving
│   ├── circuits/constitution.circom  # ZK circuit (constraint definitions)
│   └── src/prover.ts            # Groth16 proof generator (TypeScript)
├── ai-orchestrator/             # TypeScript: Agent brain + 0G SDK
│   ├── .env.example             # ← Copy this to .env and fill in values
│   └── src/
│       ├── agent.ts             # Orchestrator entry point
│       └── 0g-service.ts        # 0G Storage & DA client
├── mission-control/             # Next.js: Operator dashboard
│   └── src/app/page.tsx
├── report.md                    # Auto-generated spawn execution log
└── status.md                    # Project progress tracker & TODO list
```

---

## Prerequisites

Install all of the following before touching any module. Each module has its own runtime — missing one will break that layer.

| Tool | Version | Purpose |
|---|---|---|
| Node.js | >= 20.x | Required by all modules (contracts, ai-orchestrator, mission-control, zk-engine) |
| npm | >= 9.x | Package manager (yarn or pnpm also work) |
| circom | v2.1.x | Circuit compiler for the ZK engine |
| Git | any recent | Clone the repo |

### Install circom compiler

Install globally via npm:

```bash
npm install -g circom@latest
```

Or download the binary from the [circom GitHub releases page](https://github.com/iden3/circom/releases).

---

## Module 1 — Smart Contracts

`contracts/` · Solidity 0.8.24 · Hardhat 2.22

### What It Does

Deploys two contracts to the 0G Galileo EVM chain:
- **`AgentRegistry.sol`** — mints agent identity records, stores the MPC public key and 0G Storage hash of the agent's Constitution, and accepts ZK proof submissions via `logIntent()`
- **`MockZKVerifier.sol`** — accepts any proof for local/hackathon testing

**Deployed Addresses (Galileo Testnet — Chain ID 16602):**

| Contract | Address |
|---|---|
| AgentRegistry | `0x04D25632b0bAb33FD1C77c4eA9d591c4765F3aF5` |

### Setup

```bash
cd contracts
npm install
```

Configure `hardhat.config.ts` — replace the placeholder private key and verify the network:

```ts
// hardhat.config.ts
const PRIVATE_KEY = "0xYOUR_PRIVATE_KEY_HERE";

networks: {
  "0g-galileo": {
    url: "https://evmrpc-testnet.0g.ai",
    chainId: 16602,
    accounts: [PRIVATE_KEY]
  }
}
```

> [!WARNING]
> Never commit your real private key. Use a `.env` file (already in `.gitignore`) and load it with `dotenv`.

```bash
npx hardhat compile     # builds artifacts/ and typechain-types/
npx hardhat test        # runs test suite
npx hardhat run scripts/deploy.ts --network 0g-galileo
```

---

## Module 2 — ZK Engine

`zk-engine/` · circom 2.1.x · snarkjs 0.7.x (Groth16)

### What It Does

This is the privacy layer. It compiles a circom circuit into R1CS constraints and uses snarkjs to generate Groth16 proofs. The circuit takes two categories of inputs:
- **Private** (the agent's Constitution): `max_spend_limit`, `whitelisted_address`
- **Public** (the agent's proposed intent): `amount`, `target`, `asset`

If both constraints pass, a Groth16 proof is generated. The proof is extremely small (~256 bytes) and can be verified on-chain via an auto-generated Solidity verifier contract.

**Two-Part Structure:**
- `circuits/` — The circom circuit: defines the arithmetic constraints for Constitution compliance.
- `src/` — TypeScript prover and verifier: generates proofs via snarkjs, verifies locally, and formats calldata for on-chain submission.

### Setup

```bash
cd zk-engine
npm install
```

### Build & Run

```bash
# Step 1: Compile the circom circuit
npm run build:circuit
# This compiles the circom circuit to R1CS (constraints) + WASM (witness generator) in the build/ directory.

# Step 2: Run the trusted setup
npm run setup
# This generates the Powers of Tau ceremony, circuit-specific proving key (zkey),
# verification key (JSON), and auto-generates the Groth16Verifier.sol Solidity contract.

# Step 3: Generate a proof
npm run prove

# Step 4: Verify a proof (standalone)
npm run verify
```

> [!IMPORTANT]
> The `build/` directory is gitignored. You must run `build:circuit` and `setup` before generating proofs. The trusted setup only needs to run once per circuit change.

### Expected Output

```
Starting snarkjs Groth16 Prover for Sovereign Agent intent...
✅ Proof generated successfully! The Agent followed the Constitution.
Public Signals: intentAmount=800, targetAddress=0xdeadbeef..., assetId=1, valid=1
✅ Verification successful.
```

### Modifying the Constitution rules

The constitution and intent are hardcoded in `src/prover.ts` for the hackathon demo. To test a violation, change `intentAmount` to something above 1000 and re-run — proof generation will fail because no valid witness exists. To deploy this in production, feed constitution and intent as runtime inputs from the AI Orchestrator.

---

## Module 3 — AI Orchestrator

`ai-orchestrator/` · TypeScript · `@0gfoundation/0g-ts-sdk` v1.2.6 · ethers v6

### What It Does

The agent's brain. Handles the complete lifecycle:
1. Generates an MPC shard and uploads it to **0G Storage** (real on-chain TX)
2. Registers the agent on the **AgentRegistry** contract (real on-chain TX)
3. Formulates an AI intent and posts it to **0G DA** as immutable memory (real on-chain TX)
4. Triggers the ZK prover, then settles the proof and DA reference on-chain (real on-chain TX)

Includes a resilient **`waitForReceipt()` RPC helper** that handles the Galileo dev RPC quirk of returning `-32000` instead of `null` for unconfirmed transactions, falling back to manual polling with a 5-minute timeout.

### Setup

```bash
cd ai-orchestrator
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for all variables with inline documentation. Minimum required:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai/
INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
SP1_PROVER=mock
```

### Run

The orchestrator is invoked by the Mission Control API — not run directly. To test in isolation:

```bash
npx ts-node --transpile-only src/agent.ts
```

Results are automatically appended to `report.md` in the repo root.

---

## Module 4 — Mission Control Dashboard

`mission-control/` · Next.js 16 · React 19 · Tailwind CSS v4

### What It Does

The operator-facing dashboard. Features:
- **Spawn Agent** — triggers the full pipeline end-to-end with real-time telemetry
- **Network Status** — live wallet balance, block height, and 0G Galileo connectivity
- **Intent Log** — shows each spawned agent's ID, DA root hash, and TX hashes
- **ZK Status** — proving duration and proof mode (Mock / Network)

### Setup

```bash
cd mission-control
npm install
npm run dev       # http://localhost:3000
```

---

## End-to-End Execution Flow

```
User clicks "Spawn Agent" in Mission Control
         │
         ▼
Phase 1: GENESIS
  ├─ MPC shard generated
  ├─ Shard uploaded to 0G Storage (Turbo indexer) → real TX ✅
  └─ Agent registered in AgentRegistry.sol → real TX ✅
         │
         ▼
Phase 2: INTENT FORMATION
  └─ Intent struct built (amount, target, asset_id)
         │
         ▼
Phase 3: ZK PROVING
  ├─ Inputs prepared for circom/snarkjs Groth16 circuit
  ├─ Circuit verifies: intentAmount <= maxSpendLimit AND targetAddress === whitelistedAddress
  ├─ Groth16 proof generated (points A, B, C + public signals)
  └─ Raw intent posted to 0G DA as tamperproof memory log → real TX ✅
         │
         ▼
Phase 4: DA COMMITMENT
  └─ Raw intent posted to 0G DA → real TX ✅
         │
         ▼
Phase 5: SETTLEMENT
  └─ AgentRegistry.logIntent(agentId, daRoot, pubInputs, proof) → real TX ✅
         │
         ▼
  🚀 MISSION SUCCESSFUL — result appended to report.md
```

---

## 0G Galileo Testnet — Key Addresses

| Contract | Address |
|---|---|
| AgentRegistry | `0x04D25632b0bAb33FD1C77c4eA9d591c4765F3aF5` |
| 0G Storage Flow | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| 0G Storage Mine | `0x00A9E9604b0538e06b268Fb297Df333337f9593b` |
| 0G DA Entrance | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |

---

## Configuration Reference

| Module | Config File / Variable |
|---|---|
| `contracts/` | `hardhat.config.ts` → `PRIVATE_KEY`, `url`, `chainId` |
| `ai-orchestrator/` | `.env` → `PRIVATE_KEY`, `RPC_ENDPOINT`, `STORAGE_NODE_URL`, `INDEXER_URL` |
| `zk-engine/` | `src/prover.ts` → `maxSpendLimit`, `whitelistedAddress`, intent values |
| `mission-control/` | `page.tsx` → `agents[]` (swap for live contract reads via wagmi) |

---

## Troubleshooting

**`build:circuit` fails with `circom not found`**

Install the circom compiler globally:
```bash
npm install -g circom@latest
```
Or download the binary from https://github.com/iden3/circom/releases

**`0G Storage: Failed to submit transaction`**
- Ensure your wallet has > 0.1 0G tokens (get from [faucet.0g.ai](https://faucet.0g.ai))
- Verify `INDEXER_URL` points to the Galileo turbo indexer (not the Newton standard indexer — it is dead)

**`eth_getTransactionReceipt: no matching receipts found` (-32000)**
- This is a known quirk of the Galileo dev RPC node returning an error code instead of `null` for unconfirmed transactions
- The orchestrator's `waitForReceipt()` helper handles this automatically via manual polling — no action needed

**Hardhat compilation errors**
- Ensure Node.js >= 20: `node --version`
- Run `npm install` inside `contracts/`, not the repo root

**Next.js port conflict**
```bash
PORT=3001 npm run dev
```

---

## Known Limitations

| Limitation | Detail |
|---|---|
| ZK Build Artifacts Not Committed | The `zk-engine/build/` directory (compiled circuit, zkeys, WASM) is gitignored. Every contributor must run `npm run build:circuit` and `npm run setup` inside `zk-engine/` before generating proofs. |
| Mock Agent State in UI | Mission Control preloads three fictional agents via hardcoded state. The Spawn Agent button adds more via a `setTimeout` simulation, not a real contract call. Wire up wagmi to make it live. |
| Dev RPC Only | `evmrpc-testnet.0g.ai` is flagged by 0G docs as not for production. See [status.md](status.md) for production RPC options |

---

## Links

| Resource | URL |
|---|---|
| GitHub Repo | [barneybo18/OGsovergienkey](https://github.com/barneybo18/OGsovergienkey) |
| Galileo Chain Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| Galileo Storage Explorer | [storagescan-galileo.0g.ai](https://storagescan-galileo.0g.ai) |
| 0G Docs | [docs.0g.ai](https://docs.0g.ai) |
| snarkjs | [github.com/iden3/snarkjs](https://github.com/iden3/snarkjs) |
| circom Docs | [docs.circom.io](https://docs.circom.io) |
| 0G Faucet | [faucet.0g.ai](https://faucet.0g.ai) |

---

> *"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."*
