<p align="center">
  <h1 align="center">🔑 Sovereign Agent Keys (SAK)</h1>
  <p align="center"><strong>Non-Custodial AI Agent Infrastructure on the 0G Network</strong></p>
</p>

<p align="center">
  <a href="https://scan-testnet.0g.ai"><img src="https://img.shields.io/badge/Network-0G%20Galileo%20Testnet-00FFD1?style=for-the-badge&logo=ethereum&logoColor=white" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Chain%20ID-16602-9B6DFF?style=for-the-badge" /></a>
  <a href="https://github.com/iden3/snarkjs"><img src="https://img.shields.io/badge/ZK-Groth16%20%2F%20Circom-F97316?style=for-the-badge" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-FACC15?style=for-the-badge" /></a>
</p>

<p align="center">
  <em>Give your AI agent a wallet, a constitution, and a soul — all verifiable on-chain.</em>
</p>

---

## The Problem

Today's AI agents are powerful but **custodial**. Their keys are held by platforms, their actions are opaque, and their "memory" lives on centralized servers. If the platform disappears, so does the agent.

## The SAK Solution

**Sovereign Agent Keys** is a protocol that gives every AI agent:

| Capability | How |
|---|---|
| 🔐 **Self-Sovereign Identity** | MPC key sharding via 2-of-3 Shamir Secret Sharing, stored on 0G Storage |
| 🛡️ **Verifiable Governance** | Every action is proven against a ZK constitution (Groth16) before on-chain settlement |
| 🧠 **Immutable Memory** | All intents are logged to 0G Data Availability — a permanent, audit-ready trail |
| 👤 **User Sovereignty** | 100% non-custodial. The user's connected wallet signs every transaction. No backend keys. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MISSION CONTROL                              │
│               Next.js 16 · Framer Motion · wagmi                    │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│    │  Fleet   │  │  Spawn   │  │ Govern-  │  │   Sovereign      │   │
│    │  View    │  │  Modal   │  │  ance    │  │   Action Console │   │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
└─────────┼─────────────┼─────────────┼──────────────────┼────────────┘
          │             │             │                  │
          ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       AI ORCHESTRATOR                               │
│          TypeScript · @0gfoundation/0g-ts-sdk · ethers v6           │
│                                                                     │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   │
│   │ MPC Shard │   │ 0G Storage│   │  0G DA    │   │  Prepare   │   │
│   │ Generator │   │  Upload   │   │  Logger   │   │  & Encode  │   │
│   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └──────┬─────┘   │
└─────────┼───────────────┼───────────────┼──────────────────┼────────┘
          │               │               │                  │
          ▼               ▼               ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ZK ENGINE (Circom 2.1)                            │
│              Groth16 Prover · snarkjs · Constitution Circuit        │
│                                                                     │
│         Witness ──► Prove ──► Verify ──► Export Calldata            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     0G GALILEO TESTNET                               │
│                                                                     │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│   │ AgentRegistry   │   │   Verifier.sol  │   │   0G Storage    │   │
│   │ (Registration & │   │   (On-chain ZK  │   │   (MPC Shards   │   │
│   │  Task Logging)  │   │   Verification) │   │    & Memory)    │   │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Features

### 🎯 Agent Lifecycle
- **Spawn** → Generate ZK identity proof → Register on-chain via user wallet
- **Govern** → View constitution constraints, spending limits, whitelisted addresses
- **Execute** → Issue sovereign actions (transfers, swaps) with ZK-verified settlement
- **Audit** → Full immutable intent history stored on 0G DA

### 🖥️ Mission Control Dashboard
- Premium dark-mode operator interface with real-time telemetry
- Fleet management with custom agent naming and pagination
- Live ZK proving statistics (duration, circuit type, efficiency)
- One-click agent detail modal with Identity, Governance, and Action tabs

### 🔒 Security Model
- **Zero backend keys** — all transactions signed by the user's connected wallet
- **Shamir 2-of-3 Secret Sharing** — MPC shards distributed across 0G Storage enclaves
- **Groth16 ZK proofs** — every agent action mathematically verified before settlement
- **Constitution enforcement** — spending limits and destination whitelists enforced at the circuit level

---

## Module Breakdown

| Module | Stack | Purpose |
|---|---|---|
| `contracts/` | Solidity 0.8.24, Hardhat | AgentRegistry + Groth16 Verifier deployed on 0G EVM |
| `zk-engine/` | Circom 2.1, snarkjs | Constitution circuit: enforces spending limits & address whitelists |
| `ai-orchestrator/` | TypeScript, ethers v6, 0g-ts-sdk | Agent brain: MPC sharding, storage, DA logging, ZK proving |
| `mission-control/` | Next.js 16, Framer Motion, wagmi | Operator dashboard with wallet connection and real-time telemetry |

---

## Deployed Contracts

> **Network**: 0G Galileo Testnet (Chain ID `16602`)

| Contract | Address | Explorer |
|---|---|---|
| **AgentRegistry** | `0xFC2Cb6aF333934dBF2130fbaDa4979b54cBBdec0` | [View ↗](https://scan-testnet.0g.ai/address/0xFC2Cb6aF333934dBF2130fbaDa4979b54cBBdec0) |
| **Verifier (Groth16)** | `0xdBE4c770673c4B86d27c2a1906d702027F4831c9` | [View ↗](https://scan-testnet.0g.ai/address/0xdBE4c770673c4B86d27c2a1906d702027F4831c9) |
| **MockZKVerifier** | `0xa64e0aD0b07Dcf180C33232322054A6802037DBD` | [View ↗](https://scan-testnet.0g.ai/address/0xa64e0aD0b07Dcf180C33232322054A6802037DBD) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or Rabby wallet with 0G Galileo Testnet configured
- 0G Testnet tokens ([Faucet](https://faucet.0g.ai))

### 1. Clone & Install

```bash
git clone https://github.com/barneybo18/OGsovergienkey.git
cd OGsovergienkey
```

### 2. Setup Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

### 3. Setup AI Orchestrator

```bash
cd ai-orchestrator
npm install
cp .env.example .env
# Fill in RPC_ENDPOINT, PRIVATE_KEY, and 0G endpoints
```

### 4. Setup ZK Engine

```bash
cd zk-engine
npm install
npm run setup   # Compiles circuits and generates proving keys
```

### 5. Launch Mission Control

```bash
cd mission-control
npm install
cp .env.example .env  # Or create .env with RPC_ENDPOINT and PRIVATE_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Connect your wallet → Start spawning sovereign agents.

---

## Environment Variables

Create `.env` files in both `ai-orchestrator/` and `mission-control/`:

```env
PRIVATE_KEY=0x...             # Deployer key (for contract reads only)
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai/
INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
STORAGE_NODE_URL=https://storage-testnet-rpc.0g.ai
```

> **Important**: The private key is used only for reading on-chain state and preparing payloads. All actual transactions are signed by the user's connected wallet.

---

## Execution Flow

```
User Instruction                    "Send 50 0G to 0x4D6D..."
        │
        ▼
   Task Parser                      Parse intent, validate address
        │
        ▼
   ZK Prover                        Generate Groth16 proof (~28-45s)
        │
        ▼
   ABI Encoder                      Pack [pA, pB, pC, pubSignals]
        │
        ▼
   Prepare Payload                   Return unsigned TX to frontend
        │
        ▼
   User Wallet                       MetaMask signature prompt
        │
        ▼
   0G Galileo                        On-chain settlement + event log
        │
        ▼
   Fleet Update                      Agent appears with verified status
```

---

## Project Structure

```
OGsovergienkey/
├── contracts/                  # Solidity smart contracts
│   ├── contracts/
│   │   ├── AgentRegistry.sol   # Core registry + task execution
│   │   └── Verifier.sol        # Auto-generated Groth16 verifier
│   └── addresses.json          # Deployed contract addresses
├── zk-engine/                  # Zero-knowledge proving system
│   ├── circuits/               # Circom constitution circuit
│   └── scripts/                # Setup and compilation scripts
├── ai-orchestrator/            # Agent lifecycle management
│   └── src/
│       ├── agent.ts            # Main orchestrator (spawn + execute)
│       ├── prover.ts           # ZK proof generation
│       ├── task-parser.ts      # Natural language → intent parser
│       └── 0g-service.ts       # 0G Storage & DA integration
├── mission-control/            # Next.js operator dashboard
│   └── src/
│       ├── app/                # Pages and API routes
│       └── components/         # UI components (Fleet, Modal, etc.)
├── ARCHITECTURE.md             # Detailed architecture document
├── update.md                   # Development changelog
└── README.md                   # This file
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request against the `prime` branch

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <em>"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."</em>
</p>

<p align="center">
  Built with 🛡️ on <a href="https://0g.ai">0G Network</a>
</p>
