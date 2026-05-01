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

## ⚡ Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/barneybo18/OGsovergienkey.git
cd OGsovergienkey

# Install all module dependencies
cd contracts && npm install && cd ..
cd ai-orchestrator && npm install && cd ..
cd mission-control && npm install && cd ..
```

### 2. Environment Setup
Copy the example env in `ai-orchestrator`:
```bash
cd ai-orchestrator
cp .env.example .env
```
Fill in your `PRIVATE_KEY` (must have Galileo tokens). Get tokens from the [0G Faucet](https://faucet.0g.ai).

### 3. Compile ZK Circuit
*Requires `circom` and `snarkjs` installed.*
```bash
cd zk-engine/circuits
./compile.sh
```

### 4. Launch Dashboard
```bash
cd mission-control
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) to start spawning agents!

---

## Pipeline Status

> **~90% Real on Galileo Testnet** — Full end-to-end ZK pipeline migrated from SP1 to Snarkjs for on-chain verification.

| Stage | Status | Notes |
|---|---|---|
| MPC Shard → 0G Storage | ✅ Real | Turbo indexer, Flow contract linked |
| Agent Registration on-chain | ✅ Real | AgentRegistry contract on Chain 16602 |
| AI Intent → 0G DA | ✅ Real | Real Galileo DA nodes |
| Final Settlement on-chain | ✅ Real | `AgentRegistry.logIntent()` TX confirmed |
| ZK Proof (Groth16) | ⚙️ Pending | Circuit ready, artifacts pending compile |

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
| AgentRegistry | [`0x93Fb17c51fC9513818042E8F58A70DDcfa98aDdA`](https://chainscan-galileo.0g.ai/address/0x93Fb17c51fC9513818042E8F58A70DDcfa98aDdA) | [View on Chainscan](https://chainscan-galileo.0g.ai/address/0x93Fb17c51fC9513818042E8F58A70DDcfa98aDdA) |
| Verifier (Groth16) | `0x0C4a38E0BfaF3ABe5159423A15FB945fFAcabE92` | [View on Chainscan](https://chainscan-galileo.0g.ai/address/0x0C4a38E0BfaF3ABe5159423A15FB945fFAcabE92) |

---

## Links

| Resource | URL |
|---|---|
| GitHub Repo | [barneybo18/OGsovergienkey](https://github.com/barneybo18/OGsovergienkey) |
| Galileo Chain Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| 0G Docs | [docs.0g.ai](https://docs.0g.ai) |
| snarkjs Docs | [github.com/iden3/snarkjs](https://github.com/iden3/snarkjs) |
| 0G Faucet | [faucet.0g.ai](https://faucet.0g.ai) |

---

> *"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."*
