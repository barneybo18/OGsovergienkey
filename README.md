# Sovereign Agent Keys (SAK) 🗝️✨

**Giving AI Agents a "Digital Soul" in the Machine Economy.**

Built for the **0G Labs APAC Hackathon (Akon's Quest)**.

---

## 🏆 Hackathon Submission Details

### 1. Code Repository
*   **GitHub Link:** [https://github.com/barneybo18/OGsovergienkey](https://github.com/barneybo18/OGsovergienkey)
*   **Visibility:** Public
*   **Progress:** This repository contains a full-stack modular architecture developed during the hackathon period, including L1 Smart Contracts, a ZK Proving Engine, AI Orchestration logic, and a Mission Control dashboard.

### 2. 0G Integration Proof
*   **0G Chain Contract (EVM):** `0x...` *(Pending Final Settlement)*
*   **0G Explorer Link:** [View Verification Activity](https://explorer.testnet.0g.ai/)
*   **Integrated 0G Components:**
    *   **0G Storage:** Stores encrypted MPC key shards and permanent agent memory logs.
    *   **0G DA (Data Availability):** Used for low-latency, verifiable intent logging.
    *   **0G Chain (EVM):** Orchestrates the Sovereign Agent Registry and ZK Verifier logic.
    *   **Privacy features:** Integrated **Succinct SP1 ZKVM** for secure constraint execution within the 0G stack.

---


## 🚀 The Vision

We are witnessing the birth of the **Machine Economy**, where AI agents will transact, negotiate, and execute intent on behalf of humans or themselves. But there is a massive, systemic vulnerability in how AI agents operate today: **They are tenants.** 

Currently, an AI agent's private keys (its identity and financial control) are stuffed into centralized `.env` files on AWS or local servers. If the server is compromised, the agent's identity and assets are stolen. The agent has no true sovereignty. 

**Sovereign Agent Keys (SAK)** fundamentally changes this paradigm. We elevate AI agents into Sovereign Entities capable of owning their decentralized identity and assets using **0G Labs' infrastructure**, **Multi-Party Computation (MPC)**, and **Zero-Knowledge (ZK) Proofs**.

## 🛑 The Problem

1. **Centralized Key Vulnerabilities:** Storing an AI agent's private keys in `.env` files makes them honeypots for hackers.
2. **Lack of Provable Constraints:** When an agent executes a transaction, how do we know it didn't hallucinate or violate its predefined risk limits?
3. **No Verifiable Memory:** Agents lack an untamperable, provable history of their decisions and intent logs.

## 🌌 The Sovereign Solution

We give the AI agent a **Digital Soul** by sharding its private key, enforcing cryptographic constitutions, and anchoring everything to the **0G Chain**.

1. **Decentralized Key Management via MPC:** The agent's private key is generated and immediately sharded using a Threshold Signature Scheme (TSS). The encrypted shards are permanently stored on **0G Storage**. 
2. **Provable Logic via ZK-SNARKs:** The agent operates under a strict set of rules called the "Constitution." Before the agent can execute a transaction, it must generate a ZK proof (via RISC Zero / Succinct) proving that the intent conforms to its Constitution—without exposing private user inputs.
3. **Immutable Memory via 0G DA:** Every intent, ZK proof, and execution log is posted to **0G DA (Data Availability)** to ensure the agent's history is transparent, verifiable, and permanent.
4. **Agent Registry on 0G Chain:** The agent's identity, public keys, and current Constitution hashes are registered on the ultra-fast **0G EVM Chain**.

## 🛠️ The Tech Stack

*   **L1 Blockchain:** 0G Chain (EVM) for settlement, verification, and the Agent Registry smart contracts.
*   **Data & Storage:** 0G Storage & 0G DA for storing encrypted MPC key shards, agent memories, and verifiable execution logs.
*   **Privacy Engine:** Succinct / RISC Zero for ZK-SNARKs to prove the AI followed user-defined rules.
*   **Key Management:** Multi-Party Computation (MPC) Threshold Signature Scheme.
*   **AI Engine:** Eliza OS / Python orchestrating agent intents.
*   **Mission Control (Frontend):** Next.js, Tailwind CSS, Shadcn/ui, and Wagmi/Viem (built as a premium dark-mode dashboard).

## 🌊 The Execution Flow

1. **Genesis (Creation):** User mints an agent. An MPC Distributed Key Generation (DKG) event triggers. Shards are encrypted and beamed to **0G Storage**. The agent is registered on the **0G Chain**.
2. **Intent & Proof:** The agent formulates an action. It generates a ZK Proof stating: *"I am staying within my defined risk limits and Constitution."*
3. **Verification & Signing:** The MPC nodes verify the ZK Proof on the **0G Chain**. If valid, nodes retrieve their encrypted shards via **0G DA**, decrypt them locally, and perform a threshold signature for the transaction.
4. **Finality & Memory:** The signed transaction is broadcasted. The intent, proof, and result are permanently logged onto **0G Storage** as the agent's immutable memory.

---

> *"An agent is only as powerful as its autonomy. True autonomy requires sovereignty. Sovereignty requires decentralization."*
