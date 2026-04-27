# Sovereign Agent Keys (SAK) — Phase 2

> **AI agents with cryptographic sovereignty on the 0G Galileo Testnet**

[![Network](https://img.shields.io/badge/Network-0G%20Galileo%20Testnet-blue)](https://chainscan-galileo.0g.ai)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-16602-green)](https://evmrpc-testnet.0g.ai)
[![SP1](https://img.shields.io/badge/ZK%20Prover-SP1%20v6.1.0-purple)](https://docs.succinct.xyz)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

Sovereign Agent Keys (SAK) is a multi-module full-stack system that gives AI agents cryptographic sovereignty. Instead of stuffing private keys into centralised `.env` files — a massive attack surface in the emerging machine economy — SAK:

- **Shards keys** using Multi-Party Computation (MPC)
- **Enforces agent behaviour** through Zero-Knowledge proofs (SP1 STARK circuit)
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
| ZK Proof (SP1) | ⚠️ Mock | Pending Succinct Network key — see [TODO](status.md) |

---

## Architecture

| Module | Stack | Role |
|---|---|---|
| `contracts/` | Solidity + Hardhat | On-chain Agent Registry and ZK Verifier interface |
| `zk-engine/` | Rust + SP1 v6.1.0 | ZK circuit validating agent intent against its Constitution |
| `ai-orchestrator/` | TypeScript + `@0gfoundation/0g-ts-sdk` | Agent brain: MPC shard upload, 0G Storage, 0G DA |
| `mission-control/` | Next.js 16 + Tailwind | Operator dashboard: spawn agents, monitor ZK status |

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
│   └── hardhat.config.ts
├── zk-engine/                   # Rust: SP1 ZK proving circuit
│   ├── program/src/main.rs      # Guest program (runs inside zkVM)
│   └── script/src/main.rs       # Host prover script (generates proof)
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
| Node.js | >= 20.x | `contracts/`, `ai-orchestrator/`, `mission-control/` |
| npm | >= 9.x | Package manager |
| Rust | stable >= 1.75 | `zk-engine/` ZK proving circuit |
| Cargo | bundled with Rust | Rust package manager |
| SP1 Toolchain | v6.1.0 | Succinct's SP1 zkVM |
| WSL 2 | any | Required to run the Rust prover from Windows |
| Git | any recent | Clone the repo |

### Install SP1 Toolchain

SP1 does not come bundled with Rust. Run the official installer inside WSL:

```bash
curl -L https://sp1.succinct.xyz | bash
sp1up
cargo prove --version   # verify
```

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

`zk-engine/` · Rust 2021 Edition · SP1 v6.1.0

### What It Does

The privacy layer. Runs a RISC-V ZK circuit via Succinct's SP1 zkVM that takes two inputs:
- **Constitution**: `max_spend_limit`, `whitelisted_address`
- **Intent**: `amount`, `target_address`

If both rules pass, it generates a STARK proof. The proof is posted on-chain to prove compliance without revealing the underlying constitution values.

**Two-Part Structure:**
- `program/` — Guest: runs inside the SP1 zkVM, validates rules, commits public outputs to the journal
- `script/` — Host: sets up the prover client, feeds inputs, generates the proof, extracts outputs

### Setup

```bash
# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Inside WSL — install SP1 toolchain
curl -L https://sp1.succinct.xyz | bash
sp1up
```

### Build & Run

```bash
# Step 1: Build the guest ELF binary (inside WSL)
cd zk-engine/program
cargo prove build

# Step 2: Run the prover (always use --release)
cd zk-engine/script
SP1_PROVER=mock cargo run --release     # instant mock proof — no key needed
# SP1_PROVER=network cargo run --release  # real proof via Succinct cloud (requires SP1_PRIVATE_KEY)
```

> [!IMPORTANT]
> The ELF file (`program/elf/`) is gitignored. You must run `cargo prove build` before the host script will compile — it uses `include_bytes!` on the ELF path.

### Expected Output (mock mode)

```
Loading inputs from zk_input.json...
Starting SP1 Prover for Sovereign Agent intent...
✅ Proof generated successfully! The Agent followed the Constitution.
Public Journal reads amount: 800
⚠️  Mock mode: skipping cryptographic verification.
✅ Pipeline validated successfully in mock mode.
✅ Prover output saved to zk_output.json
```

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
Phase 3: ZK PROVING (WSL)
  ├─ Inputs written to zk_input.json
  ├─ SP1 prover invoked via cargo run --release
  └─ Proof + public values written to zk_output.json
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

| Module | File | Variables |
|---|---|---|
| `contracts/` | `hardhat.config.ts` | `PRIVATE_KEY`, `url`, `chainId` |
| `ai-orchestrator/` | `.env` | `PRIVATE_KEY`, `RPC_ENDPOINT`, `INDEXER_URL`, `SP1_PROVER`, `SP1_PRIVATE_KEY` |
| `zk-engine/` | `script/src/main.rs` | `max_spend_limit`, `whitelisted_address`, intent values |

---

## Troubleshooting

**`cargo prove build` fails with missing target**
```bash
sp1up
rustup target add riscv32im-unknown-none-elf
```

**`0G Storage: Failed to submit transaction`**
- Ensure your wallet has > 0.1 0G tokens (get from [faucet.0g.ai](https://faucet.0g.ai))
- Verify `INDEXER_URL` points to the Galileo turbo indexer (not the Newton standard indexer — it is dead)

**`eth_getTransactionReceipt: no matching receipts found` (-32000)**
- This is a known quirk of the Galileo dev RPC node returning an error code instead of `null` for unconfirmed transactions
- The orchestrator's `waitForReceipt()` helper handles this automatically via manual polling — no action needed

**`SP1_PROVER=network` panics with exit code 101**
- You must set `SP1_PRIVATE_KEY` in `.env` — register at [succinct.xyz](https://succinct.xyz) to get one
- Use `SP1_PROVER=mock` for demos without a key

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
| ZK Proof is Mock | `SP1_PROVER=mock` — proof has no cryptographic content. Requires Succinct Network key for real STARK proof. See [status.md](status.md) |
| Dev RPC Only | `evmrpc-testnet.0g.ai` is flagged by 0G docs as not for production. See [status.md](status.md) for production RPC options |
| Local CPU Proving | `SP1_PROVER=cpu` takes 20–45 min and requires 16GB+ RAM in WSL. Will SIGKILL on low-memory machines |

---

## Links

| Resource | URL |
|---|---|
| GitHub Repo | [barneybo18/OGsovergienkey](https://github.com/barneybo18/OGsovergienkey) |
| Galileo Chain Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| Galileo Storage Explorer | [storagescan-galileo.0g.ai](https://storagescan-galileo.0g.ai) |
| 0G Docs | [docs.0g.ai](https://docs.0g.ai) |
| SP1 Docs | [docs.succinct.xyz](https://docs.succinct.xyz) |
| 0G Faucet | [faucet.0g.ai](https://faucet.0g.ai) |

---

> *"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."*
