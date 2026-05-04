# Sovereign Agent Keys (SAK) — Phase 2

> **AI agents with cryptographic sovereignty on the 0G Galileo Testnet**

[![Network](https://img.shields.io/badge/Network-0G%20Galileo%20Testnet-blue)](https://chainscan-galileo.0g.ai)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-16602-green)](https://evmrpc-testnet.0g.ai)
[![ZK-SNARK](https://img.shields.io/badge/ZK%20Prover-snarkjs%20%2F%20circom-orange)](https://github.com/iden3/snarkjs)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

Sovereign Agent Keys (SAK) is a multi-module full-stack system that gives AI agents cryptographic sovereignty. Instead of stuffing private keys into centralised `.env` files — a massive attack surface in the emerging machine economy — SAK:

- **Shards keys** using Multi-Party Computation (MPC)
- **Enforces agent behaviour** through Zero-Knowledge proofs (Groth16 / Circom)
- **Anchors everything** to 0G Labs' decentralised storage and DA infrastructure

Built for the **0G Labs APAC Hackathon (Akon's Quest)**.

---

## ⚡ Quick Start

### 🏗️ Phase 1: One-Time Setup
```bash
# 1. Install all dependencies
cd contracts && npm i && cd ..
cd ai-orchestrator && npm i && cd ..
cd mission-control && npm i && cd ..

# 2. Configure Environment
# Copy .env.example and add your Galileo Private Key
cp ai-orchestrator/.env.example ai-orchestrator/.env
cp mission-control/.env.example mission-control/.env.local

# 3. Setup ZK & Contracts
cd zk-engine/circuits && bash compile.sh && cd ../../
cd contracts && npx hardhat run scripts/deploy.ts --network 0g-testnet
```

### 🚀 Phase 2: Daily Run
```bash
# Start the dashboard
cd mission-control
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to manage your Sovereign Fleet.

---

## 📜 Update Log
For a detailed list of recent architectural and UI improvements, see [update.md](./update.md).

## Pipeline Status

> **100% Real on Galileo Testnet** — Full end-to-end ZK pipeline stabilized and verified on-chain. Cryptographic intent enforcement is now fully operational.

| Stage | Status | Notes |
|---|---|---|
| MPC Shard → 0G Storage | ✅ Real | Shamir 2-of-3 split, encrypted, pinned to 0G Turbo indexer |
| Agent Registration on-chain | ✅ Real | AgentRegistry contract on Chain 16602 |
| AI Intent → 0G DA | ✅ Real | Real Galileo DA nodes |
| Final Settlement on-chain | ✅ Real | `AgentRegistry.logIntent()` TX confirmed |
| ZK Proof (Groth16) | ✅ Real | Circom 2.0 circuit, Groth16 artifacts compiled, real Verifier.sol deployed |

---

## Architecture

| Module | Stack | Role |
|---|---|---|
| `contracts/` | Solidity + Hardhat | On-chain Agent Registry and Groth16 Verifier |
| `zk-engine/` | Circom 2.0 | ZK circuit validating agent intent against its Constitution |
| `ai-orchestrator/` | TypeScript + snarkjs | Agent brain: Proving logic, 0G Storage, 0G DA |
| `mission-control/` | Next.js 15 + Tailwind | Operator dashboard: spawn agents, monitor ZK status |

---

## Repository Structure

```
OGsovergienkey/
├── contracts/                   # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── AgentRegistry.sol    # Core registry + intent logger
│   │   ├── Verifier.sol         # Groth16 Verifier (exported from Circom)
│   │   └── interfaces/
│   │       └── IZKVerifier.sol
│   └── hardhat.config.ts
├── zk-engine/                   # ZK Proving Logic
│   └── circuits/                # Circom circuits and compile scripts
├── ai-orchestrator/             # TypeScript: Agent brain + 0G SDK
│   ├── src/
│   │   ├── agent.ts             # Orchestrator entry point
│   │   └── prover.ts            # Snarkjs proof generation wrapper
│   └── 0g-service.ts            # 0G Storage & DA client
├── mission-control/             # Next.js: Operator dashboard
└── ARCHITECTURE.md              # Detailed technical deep-dive
```

---

## 0G Galileo Testnet — Key Addresses

| Contract | Address | Explorer |
|---|---|---|
| AgentRegistry | [`0x2697e7Fdeac0FA4BC0b9dAbCa8574F4C5265b275`](https://chainscan-galileo.0g.ai/address/0x2697e7Fdeac0FA4BC0b9dAbCa8574F4C5265b275) | [View on Chainscan](https://chainscan-galileo.0g.ai/address/0x2697e7Fdeac0FA4BC0b9dAbCa8574F4C5265b275) |
| Verifier (Groth16) | [`0xdA121E88f23B88305C0fb0843Cf32b8FBF79DaAB`](https://chainscan-galileo.0g.ai/address/0xdA121E88f23B88305C0fb0843Cf32b8FBF79DaAB) | [View on Chainscan](https://chainscan-galileo.0g.ai/address/0xdA121E88f23B88305C0fb0843Cf32b8FBF79DaAB) |

---

## Links

| Resource | URL |
|---|---|
| GitHub Repo | [barneybo18/OGsovergienkey](https://github.com/barneybo18/OGsovergienkey) |
| Demo Video | [YouTube — 3 min walkthrough](YOUR_YOUTUBE_LINK) |
| X Post | [@barneybo18 on X](YOUR_X_POST_LINK) |
| Live Dashboard | [mission-control.vercel.app](YOUR_VERCEL_URL) |
| Galileo Chain Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| 0G Docs | [docs.0g.ai](https://docs.0g.ai) |
| snarkjs Docs | [github.com/iden3/snarkjs](https://github.com/iden3/snarkjs) |
| 0G Faucet | [faucet.0g.ai](https://faucet.0g.ai) |

---

> *"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."*
