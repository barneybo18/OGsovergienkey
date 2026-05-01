# 🏗️ Architecture: Sovereign Agent Keys

This document outlines the technical architecture for Sovereign Agent Keys, leveraging 0G Labs' decentralized data infrastructure combined with ZK-SNARKs and MPC.

## 📐 System Components

Our architecture is divided into 4 primary layers:

### 1. Mission Control (Frontend Application)
*   **Stack:** Next.js 15, Tailwind CSS v4, Framer Motion, Lucide Icons.
*   **Functionality:** A premium dark-mode dashboard for human operators. Users can spawn new agents, monitor network telemetry, and track on-chain settlement status in real-time.

### 2. The AI Orchestrator (Agent Logic Layer)
*   **Stack:** Node.js + TypeScript + `@0gfoundation/0g-ts-sdk`.
*   **Functionality:** The "brain". It coordinates the agent's lifecycle: generating MPC shards, uploading to 0G Storage, posting intent logs to 0G DA, and triggering the ZK proving pipeline.

### 3. The Trustless Privacy Engine (ZK Proving Layer)
*   **Stack:** Circom 2.0 + snarkjs (Groth16).
*   **Functionality:** When the AI formulates an intent, it passes this intent and its "Constitution" (risk rules) to the ZK Prover. The prover generates a SNARK verifying that the intent adheres to the rules (e.g., spending limits and whitelisted addresses) without revealing the underlying proprietary data.
*   **On-Chain Verification:** Unlike previous SP1 implementations, this architecture produces compact proofs that are verified on-chain by a native Solidity `Verifier.sol` contract on 0G Galileo.

### 4. Decentralized Custody & Settlement (0G Labs & MPC)
*   **Stack:** 0G Chain (EVM), 0G Storage, 0G Data Availability (DA).
*   **Functionality:**
    *   **0G Storage:** Stores the agent's encrypted MPC key shards and Constitution artifacts.
    *   **0G DA:** Acts as the agent's "Immutable Memory," holding the raw intent data before it is settled on-chain.
    *   **0G Chain:** The source of truth where agent identity is registered and intentions are cryptographically settled.

---

## 🛡️ Why 0G Labs is the Absolute Backbone

*   **0G Storage:** Provides the high-availability decentralized storage required for rapid retrieval of MPC shards.
*   **0G DA:** Enables the agent to log a massive stream of "thoughts" and "intents" without the astronomical gas costs of storing raw data directly on-chain.
*   **0G Chain (EVM):** Provides the execution environment for our ZK Verifier and Agent Registry, ensuring that agent actions are only settled if they are cryptographically proven to be valid.

---

*This architecture turns an off-chain AI into a cryptographically secure, on-chain autonomous entity.*
