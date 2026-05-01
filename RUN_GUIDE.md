# 🚀 Run Guide: Sovereign Agent Keys

Follow these steps to launch the SAK system and spawn your first agent.

## 1. Prerequisites

- **Node.js**: >= 20.x
- **circom**: Installed on your system (or use [zkREPL.dev](https://zkrepl.dev) to generate artifacts)
- **snarkjs**: `npm install -g snarkjs`
- **Wallet**: An EVM wallet with 0G Galileo Testnet tokens.

## 2. Environment Configuration

Create a `.env` file in the `ai-orchestrator` directory:

```env
PRIVATE_KEY=0x...
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai/
INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
STORAGE_NODE_URL=https://storage-testnet-rpc.0g.ai
```

## 3. Circuit Compilation

Navigate to the circuits directory and compile the constitution logic:

```bash
cd zk-engine/circuits
chmod +x compile.sh
./compile.sh
```

This generates:
- `Verifier.sol` in `contracts/contracts/`
- `circuit_final.zkey` in `zk-engine/circuits/`
- WASM artifacts in `zk-engine/circuits/build/`

## 4. Smart Contract Deployment

Deploy the Agent Registry and ZK Verifier to 0G Galileo:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network 0g-testnet
```

## 5. Start Mission Control

Launch the operator dashboard:

```bash
cd mission-control
npm run dev
```

Visit `http://localhost:3001` to begin spawning agents.

---

## 🛠️ Troubleshooting

### "Artifact for contract 'Verifier' not found"
Ensure you have run the `./compile.sh` script in `zk-engine/circuits` before deploying contracts. This script generates the Solidity verifier.

### "RPC Error: -32000"
This is a known Galileo RPC quirk. The system includes a polling fallback in `agent.ts` that will eventually pick up the transaction. Just wait for the "Network Telemetry" log to confirm.

### Proving fails locally
If you don't have `circom` installed, the `ai-orchestrator` will enter **Demo Mode** automatically. It will still post transactions to the 0G Chain and DA, but it will skip the local cryptographic proving step.
