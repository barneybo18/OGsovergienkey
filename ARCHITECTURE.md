# 🏗️ Architecture: Sovereign Agent Keys

This document outlines the deep technical architecture for Sovereign Agent Keys, heavily leveraging 0G Labs' decentralized data infrastructure combined with ZK and MPC.

## 📐 System Components

Our architecture is divided into 4 primary layers:

### 1. Mission Control (Frontend Application)
*   **Stack:** Next.js 14, Tailwind CSS, Shadcn UI, Wagmi/Viem.
*   **Functionality:** A sleek, premium dark-mode dashboard for human operators. Here, users can mint new agents, define the agent's "Constitution" (risk parameters, asset limits, allowed contracts), and monitor the real-time stream of the agent's on-chain actions and ZK validations.

### 2. The AI Orchestrator (Agent Logic Layer)
*   **Stack:** Eliza OS (or Python Agent frameworks like LangChain/AutoGen).
*   **Functionality:** The "brain". It evaluates external triggers (price feeds, social sentiment, specific prompts) and decides on an intent. It operates in an isolated environment and never holds the full private key in memory.

### 3. The Trustless Privacy Engine (ZK Proving Layer)
*   **Stack:** RISC Zero / Succinct.
*   **Functionality:** When the AI formulates an intent (e.g., "Swap 1 ETH for 0G Tokens"), it passes this intent and its current Constitution to the ZK Prover. The prover generates a SNARK verifying that the intent mathematically adheres to the Constitution.
*   **Zero-Knowledge aspect:** The proof can verify the agent didn't exceed a USD limit without having to publicly reveal the exact USD limit or the agent's underlying proprietary trading model.

### 4. Decentralized Custody & Settlement (0G Labs & MPC)
*   **Stack:** 0G Chain (EVM), 0G Storage, 0G Data Availability (DA), MPC Threshold Nodes.
*   **Functionality:** This is the bedrock of the Sovereign Entity.

---

## 🔄 The Protocol Flow in Detail

### Phase 1: The Agent Genesis (Minting & DKG)
1.  **Deployment:** A user interacts with Mission Control to spawn a new agent, signing the transaction via Wagmi/Viem.
2.  **DKG:** A Multi-Party Computation (MPC) Distributed Key Generation protocol is initiated among a decentralized validator set.
3.  **Sharding & 0G Storage:** The newly generated private key is sharded (e.g., a 2-of-3 threshold). The individual shards are encrypted so only the specific MPC node can decrypt them. These encrypted shards are pinned directly to **0G Storage**.
4.  **0G Chain Registration:** The agent's Public Address and the IPFS/0G hash of its encrypted "Constitution" are stored in the Agent Registry smart contract on the **0G EVM Chain**.

### Phase 2: Intent Generation & ZK Proof
1.  **Decision:** The AI Orchestrator decides an action must be taken based on market conditions.
2.  **ZK Proving:** A RISC Zero/Succinct circuit runs. It takes the proposed transaction, the current state, and the Constitution as inputs. It outputs a `Proof`.
3.  **DA Posting:** The raw intent data and off-chain context are bundled and pushed to **0G DA** to guarantee data availability for the MPC signing nodes, preventing data censorship.

### Phase 3: MPC Verification & Signing
1.  **Request:** The AI submits the `(TransactionData, ZKProof, 0G_DA_Reference)` to the MPC node network.
2.  **Validation:** The MPC nodes call the Verifier Smart Contract on the 0G Chain to validate the ZKProof.
3.  **Retrieval:** Nodes pull their encrypted key shards from **0G Storage** and decrypt them in-memory.
4.  **Threshold Signature:** Since the ZK proof is valid (meaning the AI followed its rules), the nodes threshold-sign the EVM transaction.
5.  **Memory Commit:** The EVM transaction is broadcast to the 0G Chain. Concurrently, the success payload and state changes are written to **0G Storage**. This builds the agent's immutable, verifiable "Memory".

## 🛡️ Why 0G Labs is the Absolute Backbone

Without 0G, this architecture collapses under gas fees and data bottlenecks.
*   **0G Storage:** MPC nodes need a highly available, robust decentralized storage layer to hold encrypted key material. Traditional IPFS is ephemeral; AR/Filecoin UX is clunky. 0G Storage provides the native speed and permanence required for instant shard retrieval during the singing phase.
*   **0G DA:** ZK proofs are small, but the *intent data* and the *AI context logs* are massive. Posting these to Ethereum or standard L2s for verification would bankrupt the agent. 0G DA provides the massive throughput required to log an AI's constant stream of thoughts and intents affordably.
*   **0G Chain (EVM):** Highly scalable L1 execution for the ZK Verifier contracts and standard operations.

---

*This architecture turns an off-chain LLM into a cryptographically secure, on-chain autonomous entity.*
