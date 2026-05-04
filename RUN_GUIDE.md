# 🚀 Run Guide: Sovereign Agent Keys

Use this guide to understand what needs to be set up once versus what you need to run every time you use the system.

---

## 🛠️ Track A: The Foundation (One-Time Setup)
*You only need to do these steps once when setting up the project for the first time.*

### 1. Install Dependencies
Run this in the root directory:
```bash
cd contracts && npm install && cd ..
cd ai-orchestrator && npm install && cd ..
cd mission-control && npm install && cd ..
```

### 2. Environment Configuration
Create a `.env` file in `ai-orchestrator/`:
```env
PRIVATE_KEY=0x... # Your Galileo Wallet Key
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai/
INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
```

### 3. ZK Circuit Compilation
Compile the mathematical "Constitution" that governs your agents:
```bash
cd zk-engine/circuits
bash compile.sh
```

### 4. Smart Contract Deployment
Deploy your registry to the 0G Galileo Testnet:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network 0g-testnet
```
*Note: This saves your contract addresses to `addresses.json`. You are now ready to go!*

---

## 🛰️ Track B: The Mission (Every Time You Run)
*These are the only steps you need to take to use the app daily.*

### 1. Launch the Mission Control Dashboard
```bash
cd mission-control
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 2. Manage Your Fleet
- **Spawn Agents**: Click the "Spawn" button to create a new ZK-secured agent.
- **Persistent View**: Because of the decentralized scanner, your agents will appear automatically even after a refresh. Use the **Rotate** icon to fetch the latest updates from the blockchain.

---

## 🛠️ Troubleshooting

### "ZK Proof is invalid"
This happens if your `ai-orchestrator` artifacts don't match the on-chain `Verifier`. 
**Fix:** If you change your circuit, you must re-run **Track A (Steps 3 & 4)**.

### 0G Testnet RPC Lag
If the dashboard says "Syncing" for a long time, the 0G Testnet nodes might be under high load. Simply wait or click the "Refresh" button in the "Active Fleet" section.
