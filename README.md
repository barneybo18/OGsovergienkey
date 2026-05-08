# Sovereign Agent Keys (SAK)

> **AI agents with cryptographic sovereignty on the 0G Galileo Testnet**

[![Network](https://img.shields.io/badge/Network-0G%20Galileo%20Testnet-blue)](https://chainscan-galileo.0g.ai)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-16602-green)](https://evmrpc-testnet.0g.ai)
[![ZK-SNARK](https://img.shields.io/badge/ZK%20Prover-Groth16%20%2F%20Circom%202.0-orange)](https://github.com/iden3/snarkjs)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What Is This?

Every AI agent managing crypto today stores its private key in a `.env` file on someone's laptop. One compromised server = total loss.

**Sovereign Agent Keys fixes this:**

- 🔐 **Key Sharding** — The agent's private key is split into 3 pieces (Shamir 2-of-3). No single party can reconstruct it.
- 🛡️ **ZK-Enforced Rules** — Every transaction must pass a Groth16 proof on-chain before it can settle. The agent physically can't break its own rules.
- 🧠 **Immutable Memory** — Every decision the agent makes is permanently logged to 0G DA. Full audit trail, forever.
- ⛓️ **On-Chain Identity** — Agents are registered in a smart contract with their public key and constitution hash. Not just anonymous wallets.

Built for the **0G Labs APAC Hackathon (Akon's Quest)**.

---

## Pipeline Status — 100% Real ✅

Every step below produces a **real, verifiable transaction** on 0G Galileo Testnet.

| Step | What Happens | Status |
|---|---|---|
| 1. Key Sharding | Agent private key split via Shamir 2-of-3, shard uploaded to 0G Storage | ✅ Real TX |
| 2. Agent Registration | Agent identity registered in AgentRegistry contract | ✅ Real TX |
| 3. ZK Proof | Groth16 proof generated (~1.5s) and verified locally | ✅ Real Proof |
| 4. DA Memory Log | Raw intent uploaded to 0G Data Availability | ✅ Real TX |
| 5. Settlement | `AgentRegistry.logIntent()` called with ZK proof — verified on-chain by Verifier contract | ✅ Real TX |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Mission Control (Next.js)                       │
│              Spawn agents • Monitor fleet • View logs               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ API calls
┌──────────────────────────────▼──────────────────────────────────────┐
│                     AI Orchestrator (TypeScript)                     │
│         Generates MPC shards • Builds intents • Calls prover        │
├──────────────┬───────────────┬───────────────┬──────────────────────┤
│  0G Storage  │    0G DA      │  ZK Engine    │   0G Chain (EVM)     │
│  Key shards  │  Agent memory │  Groth16 proof│   AgentRegistry      │
│  (Turbo idx) │  (immutable)  │  (snarkjs)    │   + Verifier.sol     │
└──────────────┴───────────────┴───────────────┴──────────────────────┘
```

| Module | Stack | Role |
|---|---|---|
| `contracts/` | Solidity 0.8.24 + Hardhat | AgentRegistry + Groth16 Verifier on 0G EVM |
| `zk-engine/` | Circom 2.0 + snarkjs | ZK circuit enforcing agent constitution rules |
| `ai-orchestrator/` | TypeScript + `@0gfoundation/0g-ts-sdk` | Agent brain: MPC, storage, DA, proving |
| `mission-control/` | Next.js 16 + Tailwind CSS v4 | Operator dashboard with real-time telemetry |

---

## Repository Structure

```
OGsovergienkey/
├── contracts/                   # Solidity smart contracts
│   ├── contracts/
│   │   ├── AgentRegistry.sol    # Core registry + intent logger
│   │   ├── Verifier.sol         # Groth16 Verifier (from circom export)
│   │   └── interfaces/
│   │       └── IZKVerifier.sol
│   ├── scripts/deploy.ts        # Deployment script
│   └── hardhat.config.ts
├── zk-engine/                   # ZK Proving
│   ├── circuits/
│   │   ├── constitution.circom  # The ZK circuit (spend limit + whitelist)
│   │   ├── compile.sh           # Builds .wasm, .zkey, verification_key.json
│   │   └── build/               # Compiled circuit artifacts (gitignored)
│   └── test/                    # Circuit tests
├── ai-orchestrator/             # TypeScript agent brain
│   ├── src/
│   │   ├── agent.ts             # Orchestrator entry point
│   │   ├── prover.ts            # snarkjs Groth16 proof wrapper
│   │   └── 0g-service.ts        # 0G Storage & DA client
│   └── .env.example             # Environment template
├── mission-control/             # Next.js dashboard
│   └── src/
│       ├── app/page.tsx         # Main dashboard
│       ├── app/api/             # spawn-agent, get-agents, network-status
│       └── components/          # AgentCard, TerminalLog, StatsCard, etc.
├── ARCHITECTURE.md              # Detailed technical deep-dive
├── RUN_GUIDE.md                 # Quick start guide
├── update.md                    # Changelog
└── report.md                    # Auto-generated spawn execution log
```

---

## Contributor Setup Guide

### Prerequisites

| Tool | Version | Required By |
|---|---|---|
| Node.js | >= 20.x | All JS modules |
| npm | >= 9.x | Package manager |
| Git | any | Clone the repo |
| Circom 2.0 | >= 2.0.0 | ZK circuit compilation (only if modifying circuits) |
| snarkjs | bundled via npm | Proof generation |

> **Note:** You do NOT need Rust or SP1. The ZK engine was migrated from SP1/Rust to Circom/snarkjs — everything runs in Node.js now.

### Step 1: Clone & Install

```bash
git clone https://github.com/barneybo18/OGsovergienkey.git
cd OGsovergienkey

# Install all module dependencies
cd contracts && npm install && cd ..
cd ai-orchestrator && npm install && cd ..
cd mission-control && npm install && cd ..
```

### Step 2: Get a Funded Galileo Wallet

1. Create a new wallet (e.g., in MetaMask) or use an existing one
2. Get testnet 0G tokens from the [0G Faucet](https://faucet.0g.ai)
3. You'll need your **private key** (with the `0x` prefix)

### Step 3: Configure Environment Files

**ai-orchestrator/.env** — Create this file:
```env
PRIVATE_KEY=0xYOUR_GALILEO_WALLET_PRIVATE_KEY
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai/
INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
STORAGE_NODE_URL=https://storage-testnet-rpc.0g.ai
```

**mission-control/.env** — Create this file (same values):
```env
PRIVATE_KEY=0xYOUR_GALILEO_WALLET_PRIVATE_KEY
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai/
INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
STORAGE_NODE_URL=https://storage-testnet-rpc.0g.ai
```

> ⚠️ **Never commit your `.env` files.** They are already in `.gitignore`.

### Step 4: Compile Contracts

The contracts need to be compiled so the ABI artifacts exist for the orchestrator and dashboard:

```bash
cd contracts
npx hardhat compile
```

This generates `artifacts/` and `typechain-types/`. If you need to redeploy (new contracts):

```bash
npx hardhat run scripts/deploy.ts --network 0g-testnet
```

This writes the deployed addresses to `contracts/addresses.json`.

### Step 5: ZK Circuit Artifacts

The pre-compiled circuit artifacts (`.wasm`, `.zkey`, `verification_key.json`) are already committed to the repo. You do NOT need to recompile unless you modify `constitution.circom`.

If you do need to recompile:

```bash
cd zk-engine/circuits
bash compile.sh
```

> **Important:** If you recompile the circuit, you must also redeploy the `Verifier.sol` contract — the verification key is baked into the Solidity verifier.

### Step 6: Run the Pipeline

**Option A — Via Dashboard (recommended):**
```bash

npm run dev
```
Open [http://localhost:3001](http://localhost:3001) to start spawning agents!

---

## Pipeline Status

> **~90% Real on Galileo Testnet** — Full end-to-end ZK pipeline migrated from SP1 to Snarkjs for on-chain verification.

| Stage | Status | Notes |
|---|---|---|
| MPC Shard → 0G Storage | ✅ Real | Shamir 2-of-3 split, encrypted, pinned to 0G Turbo indexer |
| Agent Registration on-chain | ✅ Real | AgentRegistry contract on Chain 16602 |
| AI Intent → 0G DA | ✅ Real | Real Galileo DA nodes |
| Final Settlement on-chain | ✅ Real | `AgentRegistry.logIntent()` TX confirmed |
| ZK Proof (Groth16) | ✅ Real | circom 2.0 circuit, snarkjs Groth16, deployed Verifier.sol |

---

## Architecture

| Module | Stack | Role |
|---|---|---|
| `contracts/` | Solidity + Hardhat | On-chain Agent Registry and Groth16 Verifier |
| `zk-engine/` | Circom 2.x + snarkjs (Groth16) | ZK circuit validating agent intent against its Constitution |
| `ai-orchestrator/` | TypeScript + snarkjs + `@0gfoundation/0g-ts-sdk` | Agent brain: proving logic, 0G Storage, 0G DA |
| `mission-control/` | Next.js 15 + Tailwind | Operator dashboard: spawn agents, monitor ZK status |

---

## Repository Structure

```
OGsovergienkey/
├── contracts/                   # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── AgentRegistry.sol    # Core registry + intent logger
│   │   ├── Verifier.sol         # Groth16 Verifier (exported from circom/snarkjs)
│   │   ├── interfaces/
│   │   │   └── IZKVerifier.sol
│   │   └── mock/
│   │       └── MockZKVerifier.sol
│   ├── hardhat.config.ts
│   └── package.json
├── zk-engine/                   # circom + snarkjs: Groth16 ZK proving
│   ├── circuits/
│   │   ├── constitution.circom  # ZK circuit (constraint definitions)
│   │   └── compile.sh           # Circuit compilation script
│   └── test/                    # Circuit tests
├── ai-orchestrator/             # TypeScript: Agent brain + 0G SDK
│   ├── src/
│   │   ├── agent.ts             # Orchestrator entry point
│   │   ├── prover.ts            # Snarkjs proof generation wrapper
│   │   └── 0g-service.ts        # 0G Storage & DA client
│   └── .env.example
├── mission-control/             # Next.js: Operator dashboard
│   └── src/app/page.tsx
├── ARCHITECTURE.md              # Detailed technical deep-dive
├── report.md                    # Auto-generated spawn execution log
└── RUN_GUIDE.md                 # Quick-start run guide
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

Deploys three contracts to the 0G Galileo EVM chain:
- **`AgentRegistry.sol`** — mints agent identity records, stores the MPC public key and 0G Storage hash of the agent's Constitution, and accepts ZK proof submissions via `logIntent()`
- **`Verifier.sol`** — real Groth16 verifier auto-generated from snarkjs — verifies proofs on-chain
- **`MockZKVerifier.sol`** — accepts any proof for local/hackathon testing

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

If both constraints pass, a Groth16 proof is generated. The proof is extremely small (~256 bytes) and can be verified on-chain via the deployed `Verifier.sol` contract.

### Setup & Build

```bash
cd zk-engine/circuits
./compile.sh
```

This will:
1. Compile the circom circuit to R1CS + WASM
2. Run the Powers of Tau ceremony
3. Generate the proving key (zkey) and verification key
4. Export the Groth16Verifier.sol Solidity contract

> [!IMPORTANT]
> The `build/` directory is gitignored. You must run the compile script before generating proofs. The trusted setup only needs to run once per circuit change.

### Modifying the Constitution rules

The constitution and intent are hardcoded in `ai-orchestrator/src/prover.ts` for the hackathon demo. To test a violation, change `intentAmount` to something above 1000 and re-run — proof generation will fail because no valid witness exists. To deploy this in production, feed constitution and intent as runtime inputs from the AI Orchestrator.

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
```

### Run

The orchestrator is invoked by the Mission Control API — not run directly. To test in isolation:

```bash
npx ts-node --transpile-only src/agent.ts
```

Results are automatically appended to `report.md` in the repo root.

---

## Module 4 — Mission Control Dashboard

`mission-control/` · Next.js 15 · React 19 · Tailwind CSS v4

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
npm run dev       # http://localhost:3001
```

---

## End-to-End Execution Flow

```
User clicks "Spawn Agent" in Mission Control
         │
         ▼
Phase 1: GENESIS
  ├─ MPC shard generated (Shamir 2-of-3)
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
  └─ Groth16 proof generated (points A, B, C + public signals)
         │
         ▼
Phase 4: DA COMMITMENT
  └─ Raw intent posted to 0G DA as tamperproof memory log → real TX ✅
         │
         ▼
Phase 5: SETTLEMENT
  ├─ Groth16 proof verified on-chain by Verifier.sol
  └─ AgentRegistry.logIntent(agentId, daRoot, pA, pB, pC, pubSignals) → real TX ✅
         │
         ▼
  🚀 MISSION SUCCESSFUL — result appended to report.md
```

---

## Deployed Contracts (0G Galileo Testnet)

| Contract | Address | Explorer |
|---|---|---|cd mission-control
| AgentRegistry | [`0x65aAd1b52D7aD324dC98CB0EC9AACc3AF8036989`](https://chainscan-galileo.0g.ai/address/0x65aAd1b52D7aD324dC98CB0EC9AACc3AF8036989) | [View on Chainscan](https://chainscan-galileo.0g.ai/address/0x65aAd1b52D7aD324dC98CB0EC9AACc3AF8036989) |
| Verifier (Groth16) | [`0xd9C4d2FE3a4362db2A05aFA3d51934E2C31E9Ba9`](https://chainscan-galileo.0g.ai/address/0xd9C4d2FE3a4362db2A05aFA3d51934E2C31E9Ba9) | [View on Chainscan](https://chainscan-galileo.0g.ai/address/0xd9C4d2FE3a4362db2A05aFA3d51934E2C31E9Ba9) |

---

## Configuration Reference

| Module | Config File / Variable |
|---|---|
| `contracts/` | `hardhat.config.ts` → `PRIVATE_KEY`, `url`, `chainId` |
| `ai-orchestrator/` | `.env` → `PRIVATE_KEY`, `RPC_ENDPOINT`, `STORAGE_NODE_URL`, `INDEXER_URL` |
| `zk-engine/` | `circuits/constitution.circom` → constraint parameters |
| `mission-control/` | `page.tsx` → `agents[]` (swap for live contract reads via wagmi) |

---

## Troubleshooting

**`circom: command not found`**

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
| ZK Build Artifacts Not Committed | The `zk-engine/build/` directory (compiled circuit, zkeys, WASM) is gitignored. Every contributor must run the compile script before generating proofs. |
| Dev RPC Only | `evmrpc-testnet.0g.ai` is flagged by 0G docs as not for production. |

---

## Links

| Resource | URL |
|---|---|
| GitHub Repo | [barneybo18/OGsovergienkey](https://github.com/barneybo18/OGsovergienkey) |
| Galileo Chain Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| Galileo Storage Explorer | [storagescan-galileo.0g.ai](https://storagescan-galileo.0g.ai) |
| 0G Docs | [docs.0g.ai](https://docs.0g.ai) |
| snarkjs Docs | [github.com/iden3/snarkjs](https://github.com/iden3/snarkjs) |
| circom Docs | [docs.circom.io](https://docs.circom.io) |
| 0G Faucet | [faucet.0g.ai](https://faucet.0g.ai) |
| snarkjs | [github.com/iden3/snarkjs](https://github.com/iden3/snarkjs) |
| Circom Docs | [docs.circom.io](https://docs.circom.io) |

---

## Update Log

For detailed session-by-session changes, see [update.md](./update.md).

---

> *"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."*
