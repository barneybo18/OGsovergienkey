# SOVEREIGN AGENT KEYS
SAK
Giving AI Agents a "Digital Soul" in the Machine Economy
0G APAC Hackathon	Full-Stack Architecture	ZK + MPC + 0G Chain


Overview
Sovereign Agent Keys (SAK) is a multi-module full-stack system that gives AI agents cryptographic sovereignty. Instead of stuffing private keys into centralized .env files (a massive attack surface in the emerging machine economy), SAK shards those keys using Multi-Party Computation (MPC), enforces agent behavior through Zero-Knowledge proofs, and anchors everything to 0G Labs' decentralized infrastructure.

The project was built for the 0G Labs APAC Hackathon (Akon's Quest) and consists of four independent, tightly integrated modules:

Module	Stack	Role
contracts/	Solidity + Hardhat	On-chain Agent Registry and ZK Verifier interface deployed to 0G EVM
zk-engine/	circom + snarkjs (Groth16)	Zero-Knowledge proving circuit that validates agent intent against its Constitution
ai-orchestrator/	TypeScript + 0G SDK	Agent brain: formulates intents, uploads shards to 0G Storage, logs memory to 0G DA
mission-control/	Next.js 16 + Tailwind	Frontend dashboard for spawning agents, monitoring ZK status, and viewing intent logs


Prerequisites
Install all of the following before touching any module. Each module has its own language runtime — missing one will break that layer.

Tool	Version	Purpose
Node.js	>=20.x	Required by all modules (contracts, ai-orchestrator, mission-control, zk-engine)
npm	>=9.x	Package manager (yarn or pnpm also work)
circom	v2.1.x	Circuit compiler for the ZK engine
Git	any recent	Clone the repo

Install circom compiler
Install globally via npm:   npm install -g circom@latest   Or download the binary from the circom GitHub releases page.


Repository Structure
OGsovergienkey/
├── contracts/                 # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── AgentRegistry.sol  # Main registry + intent logger
│   │   ├── interfaces/
│   │   │   └── IZKVerifier.sol
│   │   └── mock/
│   │       └── MockZKVerifier.sol
│   ├── hardhat.config.ts
│   └── package.json
├── zk-engine/                 # circom + snarkjs: Groth16 ZK proving
│   ├── circuits/constitution.circom  # ZK circuit (constraint definitions)
│   └── src/prover.ts          # Groth16 proof generator (TypeScript)
├── ai-orchestrator/           # TypeScript: Agent brain + 0G SDK
│   └── src/
│       ├── agent.ts           # Simulation entry point
│       └── 0g-service.ts      # 0G Storage & DA client
└── mission-control/           # Next.js: Operator dashboard
    └── src/
        ├── app/page.tsx       # Main dashboard
        └── components/
            ├── AgentCard.tsx
            └── TerminalLog.tsx


Module 1 — Smart Contracts
contracts/  |  Solidity 0.8.24  |  Hardhat 2.22

What It Does
This module deploys two Solidity contracts to the 0G EVM chain. AgentRegistry is the core identity layer — it mints agent NFT-style records, stores the MPC public key, and holds the 0G Storage hash of the agent's "Constitution" (its ruleset). The logIntent function takes a ZK proof + intent reference and validates the proof on-chain before emitting an immutable log entry.

Step 1: Install dependencies
cd contracts
npm install

Step 2: Configure environment
Open hardhat.config.ts and replace the placeholder private key with your real deployer wallet key. The file also contains the 0G Newton Testnet RPC and chain ID — verify these against the official 0G docs as testnet details can change.

# hardhat.config.ts (relevant section)
const PRIVATE_KEY = "0xYOUR_PRIVATE_KEY_HERE";

networks: {
  "0g-testnet": {
    url: "https://rpc-testnet.0g.ai",
    chainId: 16600,
    accounts: [PRIVATE_KEY]
  }
}

Security Warning
Never commit your real private key to Git. Use a .env file (already in .gitignore) and load it with dotenv or hardhat-dotenv.

Step 3: Compile contracts
npx hardhat compile
Successful output creates artifacts/ and typechain-types/ directories. Both are gitignored — they regenerate from source.

Step 4: Run tests
npx hardhat test

Step 5: Deploy to 0G Testnet
npx hardhat run scripts/deploy.ts --network 0g-testnet
Note: A deploy script is not yet in the repo. You will need to write one or deploy via the Hardhat console. The constructor expects the address of a ZK Verifier contract — deploy MockZKVerifier.sol first for local testing, then swap it for the real verifier on testnet.

Step 6: Local development (Hardhat node)
npx hardhat node           # Starts local chain at localhost:8545
# In a second terminal:
npx hardhat run scripts/deploy.ts --network hardhat


Module 2 — ZK Engine
zk-engine/  |  circom 2.1.x  |  snarkjs 0.7.x (Groth16)

What It Does
This is the privacy layer. It compiles a circom circuit into R1CS constraints and uses snarkjs to generate Groth16 proofs. The circuit takes two categories of inputs: private (the agent's Constitution — max spend limit + whitelisted address) and public (the agent's proposed intent — amount, target, asset). If both constraints pass, a Groth16 proof is generated. The proof is extremely small (~256 bytes) and can be verified on-chain via an auto-generated Solidity verifier contract.

Two-Part Structure
•	circuits/ — The circom circuit: defines the arithmetic constraints for Constitution compliance.
•	src/ — TypeScript prover and verifier: generates proofs via snarkjs, verifies locally, and formats calldata for on-chain submission.

Step 1: Install dependencies
cd zk-engine
npm install

Step 2: Compile the circom circuit
npm run build:circuit
This compiles the circom circuit to R1CS (constraints) + WASM (witness generator) in the build/ directory.

Step 3: Run the trusted setup
npm run setup
This generates the Powers of Tau ceremony, circuit-specific proving key (zkey), verification key (JSON), and auto-generates the Groth16Verifier.sol Solidity contract in contracts/contracts/.

Important
The build/ directory is gitignored. You must run build:circuit and setup before generating proofs. The trusted setup only needs to run once per circuit change.

Step 4: Generate a proof
npm run prove

Expected output
Starting snarkjs Groth16 Prover for Sovereign Agent intent...
✅ Proof generated successfully! The Agent followed the Constitution.
Public Signals: intentAmount=800, targetAddress=0xdeadbeef..., assetId=1, valid=1
✅ Verification successful.

Step 5: Verify a proof (standalone)
npm run verify

Modifying the Constitution rules
The constitution and intent are hardcoded in src/prover.ts for the hackathon demo. To test a violation, change intentAmount to something above 1000 and re-run — proof generation will fail because no valid witness exists. To deploy this in production, feed constitution and intent as runtime inputs from the AI Orchestrator.


Module 3 — AI Orchestrator
ai-orchestrator/  |  TypeScript  |  @0glabs/0g-ts-sdk v0.2.1  |  ethers v6

What It Does
This is the agent's brain. It simulates the full lifecycle: generating an MPC shard, encrypting it, uploading it to 0G Storage, then formulating an AI intent and posting it to 0G DA as immutable memory. In a production build, this module would connect to a real MPC node network and a live LLM decision loop. For the hackathon, the 0G upload calls are mocked to return deterministic root hashes while the flow and architecture remain fully correct.

Step 1: Install dependencies
cd ai-orchestrator
npm install

Step 2: Configure environment
Create a .env file in ai-orchestrator/ with the following variables. The SDK requires a funded wallet for gas when uploading to 0G Storage.
# ai-orchestrator/.env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RPC_ENDPOINT=https://rpc-testnet.0g.ai
STORAGE_NODE_URL=https://rpc-storage-testnet.0g.ai
INDEXER_URL=https://rpc-storage-testnet.0g.ai

Step 3: Run the simulation
# Development (ts-node, no compile step)
npm start

# Or compile first then run
npm run build
node dist/agent.js

Expected output
==================================================
🤖 SOVEREIGN AGENT INITIALIZATION & EXECUTION RUN
==================================================

>> AGENT GENESIS: Generating MPC Private Key Shard...
[0G-Storage] Preparing to upload MPC Shard: shard-alpha-001
[0G-Storage] 🔓 MPC Shard pinned. Root Hash: 0xabcdef1234567890...
[Flow] Shard secured. This hash is registered on 0G EVM AgentRegistry.

>> ORCHESTRATION: Agent evaluates market and forms intent...
[0G-DA] Logging AI intent to 0G Data Availability...
[0G-DA] 🧠 AI Intent permanently stored. Root Hash: 0x999999123456...
[Flow] Memory committed. Pointer: 0x999999123456...

>> PREPARING SETTLEMENT:
1. The raw intent data is sent to the snarkjs Groth16 Prover.
2. The output Groth16 Proof + the 0G DA Root Hash are aggregated.
3. MPC Nodes verify ZK Proof on-chain -> decrypt shard -> sign transaction!
==================================================


Module 4 — Mission Control Dashboard
mission-control/  |  Next.js 16  |  React 19  |  Tailwind CSS v4

What It Does
Mission Control is the operator-facing dashboard. It shows the active agent fleet, each agent's ID, latest 0G DA memory hash, and real-time ZK proof status (Verified / Pending / Failed). Operators can spawn new agents from the UI. The spawning action simulates the DKG + 0G registration flow with a 2-second animated delay.

Step 1: Install dependencies
cd mission-control
npm install

Step 2: Run the development server
npm run dev
Open http://localhost:3000 in your browser. You will see the dark-mode dashboard with the default agent fleet (Ares-Yield-Bot, Hermes-Arb-Screener, Athena-Risk-Manager) pre-loaded.

Step 3: Production build
npm run build
npm start

Connecting to real on-chain data
The current UI uses mock data hardcoded in page.tsx. To wire it up to the live AgentRegistry contract, install wagmi and viem, configure them with the 0G Testnet chain, and replace the agents state with a contract read hook (useReadContract) that calls agents() from AgentRegistry.sol.
npm install wagmi viem @tanstack/react-query


End-to-End Execution Flow
This is the complete lifecycle of a Sovereign Agent, from birth to on-chain settlement.

Phase 1: Genesis
User clicks Spawn Agent in Mission Control. A DKG event is simulated. The MPC shard is encrypted and uploaded to 0G Storage via the AI Orchestrator. The 0G Storage root hash + agent public key are registered in AgentRegistry.sol on the 0G EVM Chain.

Phase 2: Intent Formation
The AI Orchestrator evaluates external signals (price feeds, sentiment, triggers). It formulates an AgentIntent struct specifying action, asset, amount, and target.

Phase 3: ZK Proving
The intent and the Constitution are fed into the circom/snarkjs Groth16 circuit. The circuit verifies: intentAmount <= maxSpendLimit and targetAddress === whitelistedAddress. A Groth16 proof (points A, B, C + public signals) is generated. The raw intent context is posted to 0G DA as a tamperproof memory log.

Phase 4: Verification & Settlement
The AI submits (TransactionData + ZKProof + 0G_DA_Reference) to the MPC node network. MPC nodes call IZKVerifier.verify() on the 0G Chain. If valid, nodes retrieve shards from 0G Storage, sign the transaction via threshold signature, and broadcast it.

Phase 5: Memory Commit
The transaction is finalized on 0G Chain. The intent log, ZK receipt, and state delta are written to 0G Storage as the agent's immutable, queryable memory.




Configuration Reference
Key values you will need to update across modules when deploying to a real network.

Module	Config File / Variable
contracts/	hardhat.config.ts → PRIVATE_KEY, url, chainId
ai-orchestrator/	.env → PRIVATE_KEY, RPC_ENDPOINT, STORAGE_NODE_URL, INDEXER_URL
zk-engine/	src/prover.ts → maxSpendLimit, whitelistedAddress, intent values
mission-control/	page.tsx → agents[] (swap for live contract reads via wagmi)


Known Limitations & Hackathon Notes

Mock Calls
The 0G Storage and DA upload calls in ai-orchestrator/src/0g-service.ts are mocked. They return deterministic root hashes instead of performing live uploads. Uncomment and configure the real client.upload() calls once you have a funded wallet and active testnet access.

No Deploy Script
A Hardhat deploy script (scripts/deploy.ts) does not yet exist in the repo. You will need to create one or use Hardhat's console to deploy contracts manually. The MockZKVerifier (or real Groth16Verifier) must be deployed first to satisfy the AgentRegistry constructor.

ZK Build Artifacts Not Committed
The zk-engine/build/ directory (compiled circuit, zkeys, WASM) is gitignored. Every contributor must run `npm run build:circuit` and `npm run setup` inside zk-engine/ before generating proofs.

Mock Agent State in UI
Mission Control preloads three fictional agents via hardcoded state. The Spawn Agent button adds more via a setTimeout simulation, not a real contract call. Wire up wagmi to make it live.


Troubleshooting

build:circuit fails with circom not found
Install the circom compiler globally:
npm install -g circom@latest
Or download the binary from https://github.com/iden3/circom/releases

Hardhat compilation errors
Make sure your Node.js version is >=20. Run node --version to check. Also ensure you ran npm install inside contracts/ not in the root.

Next.js port conflict
If port 3000 is in use, Next.js will prompt you to use a different port or you can force one:
PORT=3001 npm run dev

0G SDK connection errors
The testnet RPC endpoints in 0g-service.ts may be stale. Check the current values at the official 0G Labs documentation and update both the RPC and storage node URLs.


Links

GitHub Repo	https://github.com/barneybo18/OGsovergienkey
0G Explorer	https://explorer.testnet.0g.ai/
0G Docs	https://docs.0g.ai/
snarkjs	https://github.com/iden3/snarkjs
circom Docs	https://docs.circom.io/
License	MIT


"An agent is only as powerful as its autonomy. True autonomy requires sovereignty."
