<p align="center">
  <h1 align="center">🔑 Enclave Keys (EK)</h1>
  <p align="center"><strong>Non-Custodial Sovereign Agent Infrastructure on the 0G Network</strong></p>
</p>

<p align="center">
  <a href="https://chainscan.0g.ai"><img src="https://img.shields.io/badge/Network-0G%20Mainnet-00FFD1?style=for-the-badge&logo=ethereum&logoColor=white" /></a>
  <a href="https://scan-testnet.0g.ai"><img src="https://img.shields.io/badge/Network-0G%20Testnet-9B6DFF?style=for-the-badge&logo=ethereum&logoColor=white" /></a>
  <a href="https://github.com/iden3/snarkjs"><img src="https://img.shields.io/badge/ZK-Groth16%20%2F%20Circom-F97316?style=for-the-badge" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-FACC15?style=for-the-badge" /></a>
</p>

<p align="center">
  <em>Give your AI agent a wallet, a constitution, and a soul — all verifiable on-chain.</em>
</p>

---

## 🚀 Live Demo Disclaimer

**Live Deployment:** [enclavekeys.vercel.app](https://enclavekeys.vercel.app/)

> [!IMPORTANT]
> The live deployment on Vercel runs in **Demo Mode**. 
>
> Since Vercel uses serverless functions with strict resource limits, it cannot run the heavy background ZK Prover (which requires significant RAM and persistent background processes). To provide a seamless experience for judges and users, the "Spawn" and "Execute" actions in the live demo use a high-fidelity **Simulation Engine** that replicates the exact 0G storage, identity generation, and ZK proving delays without the server overhead.
>
> To run the **Full Production Prover**, please follow the [Quick Start](#quick-start) guide to run the AI Orchestrator on a local machine or a persistent VPS.

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

## 📈 Product Value & Market Potential

### 🎯 Market Fit
The explosion of AI agents (AutoGPT, BabyAGI) has created a critical infrastructure gap: **Trustless Autonomy.** Today's agents are either custodial (platforms hold the keys) or unsafe (keys stored in plain text). Enclave Keys fills this gap by providing a **Non-Custodial Sovereign Layer** for AI, enabling agents to handle real value on-chain without centralized risk.

### 🛡️ Problem-Solving Capability
We solve the **"Black Box Agent"** problem. By combining 0G’s high-throughput Data Availability with ZK-SNARKs, we ensure that an agent’s actions are not just autonomous, but *verifiably* compliant with a human-defined "Constitution." If an agent tries to break its rules, the ZK proof fails, and the transaction is rejected on-chain.

### 💎 User Value
*   **Total Sovereignty:** Users retain 100% control over agent identities via MPC sharding. No backend ever sees a full private key.
*   **Immutable Auditability:** Every decision the agent makes is anchored on 0G DA, providing a permanent, audit-ready trail for high-frequency operations.
*   **Cost Efficiency:** Leveraging 0G allows for a high-volume "stream of consciousness" log that would be prohibitively expensive on traditional L2s.

### 🚀 Growth Roadmap
1.  **V1 (Hackathon):** Core registry, ZK-enforced limits, and 0G Storage/DA integration.
2.  **V2 (Decentralization):** Transition from a centralized orchestrator to a decentralized network of TEE-enabled MPC nodes.
3.  **V3 (Ecosystem):** A "Constitution Marketplace" where users can subscribe their agents to pre-verified ZK-risk models for DeFi, Gaming, and DAO Governance.

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

## 🛠️ Project Status: Real vs. Simulated

To ensure full transparency for the 0G Hackathon, here is the breakdown of implemented production logic vs. simulated MVP components:

| Feature | Status | Implementation Detail |
|---|---|---|
| **On-Chain Registry** | 🟢 **REAL** | `AgentRegistry.sol` is fully deployed and manages agent lifecycle and intent logs on 0G Mainnet/Testnet. |
| **ZK Proving** | 🟢 **REAL** | Every agent action generates a valid Groth16 proof using `snarkjs`. Proofs are verified on-chain by `Verifier.sol`. |
| **0G Storage** | 🟢 **REAL** | MPC shards and metadata are physically uploaded to 0G Storage nodes via the `@0gfoundation/0g-ts-sdk`. |
| **0G DA Logging** | 🟢 **REAL** | Raw intent data is posted to 0G DA to ensure an immutable, high-throughput audit trail. |
| **MPC Network** | 🟡 **SIMULATED** | Shard generation (SSS) is currently handled by a centralized orchestrator. In production, this will be distributed across a network of TEE-enabled nodes. |
| **Key Custody** | 🟡 **SIMULATED** | While shards are stored on 0G, the reconstruction logic currently lives in the orchestrator memory rather than a decentralized signing network. |
| **Dashboard** | 🟢 **REAL** | The Mission Control UI is a real-time operator interface reading directly from the 0G Chain and Storage nodes. |

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

### 0G Galileo Testnet (Chain ID `16602`)

| Contract | Address | Explorer |
|---|---|---|
| **AgentRegistry** | `0x4A7DB2107b10D7694555da9C4d31FA9f7d3Feb1E` | [View ↗](https://chainscan-galileo.0g.ai/address/0x4A7DB2107b10D7694555da9C4d31FA9f7d3Feb1E) |
| **Verifier (Groth16)** | `0xd08A4C7E03269f57bCB9fd9ED2E2eE220371Fa02` | [View ↗](https://chainscan-galileo.0g.ai/address/0xd08A4C7E03269f57bCB9fd9ED2E2eE220371Fa02) |
| **MockZKVerifier** | `0xb6Cd0F6097685A8AE90Ce0E5a393CA2D61C430dA` | [View ↗](https://chainscan-galileo.0g.ai/address/0xb6Cd0F6097685A8AE90Ce0E5a393CA2D61C430dA) |

### 0G Mainnet (Chain ID `16661`)

| Detail | Value |
|---|---|
| **RPC** | `https://evmrpc.0g.ai` |
| **Chain ID** | `16661` |
| **Explorer** | [https://chainscan.0g.ai](https://chainscan.0g.ai) |
| **Currency** | 0G |

| Contract | Address | Explorer |
|---|---|---|
| **AgentRegistry** | `0x93b0650f33C86dDab1c8b6B3f0fAD768e7d3680d` | [View ↗](https://chainscan.0g.ai/address/0x93b0650f33C86dDab1c8b6B3f0fAD768e7d3680d) |
| **Verifier (Groth16)** | `0x5dB9f58162feE7d957DF9E2f9112b4BF5D2a20d3` | [View ↗](https://chainscan.0g.ai/address/0x5dB9f58162feE7d957DF9E2f9112b4BF5D2a20d3) |
| **MockZKVerifier** | `0x4c6d84d9F5A90a013bf9335b9922252b2413C7eD` | [View ↗](https://chainscan.0g.ai/address/0x4c6d84d9F5A90a013bf9335b9922252b2413C7eD) |

**Deploy to Mainnet:**
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network 0g-mainnet
```

> **Note**: The deployer wallet (`0x4D5D...F1b0`) must hold $0G on mainnet. Get tokens via a CEX withdrawal or bridge via [XSwap](https://xswap.link/bridge?toChain=16661).

---

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or Rabby wallet configured for 0G
- 0G tokens ([Testnet Faucet](https://faucet.0g.ai) · [Mainnet Bridge](https://xswap.link/bridge?toChain=16661))

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
