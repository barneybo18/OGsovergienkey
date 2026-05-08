# 🚀 ZK Engine — Build & Run Instructions

The ZK Engine uses **snarkjs** (Groth16) and **circom** to prove that an AI agent's intent complies with its Constitution (risk limits, whitelisted addresses) — without revealing private parameters.

## Prerequisites

1. **Node.js ≥20** — Required for snarkjs and the TypeScript prover
2. **circom compiler** — Install globally:
   ```bash
   npm install -g circom@latest
   ```
   Or download the binary from [circom releases](https://github.com/iden3/circom/releases)

## Structure

```
zk-engine/
├── package.json              # snarkjs + circomlib dependencies
├── tsconfig.json
├── circuits/
│   └── constitution.circom   # The ZK circuit (constraint definitions)
├── src/
│   ├── prover.ts             # Groth16 proof generator
│   ├── verifier.ts           # Local proof verification
│   └── types.ts              # Shared TypeScript types
├── scripts/
│   └── setup.js              # Automated trusted setup (ptau + zkey)
└── build/                    # Generated artifacts (gitignored)
    ├── constitution.r1cs     # Compiled circuit constraints
    ├── constitution_js/      # WASM witness generator
    ├── constitution_final.zkey  # Proving key
    ├── verification_key.json    # Verification key
    └── latest_proof.json        # Last generated proof
```

## Build & Run

```bash
cd zk-engine

# 1. Install dependencies
npm install

# 2. Compile the circom circuit → R1CS + WASM
npm run build:circuit

# 3. Run the trusted setup (generates ptau, zkey, verification key, Solidity verifier)
npm run setup

# 4. Generate a proof
npm run prove

# 5. Verify the proof locally
npm run verify
```

> ⚠️ **First setup** generates a Powers of Tau ceremony and circuit-specific proving key. This takes a minute but only needs to run once per circuit change.

## What It Proves

The ZK circuit enforces two constraints:
1. **Max Spend Limit** — `intentAmount <= maxSpendLimit`
2. **Address Whitelist** — `targetAddress === whitelistedAddress`

If either constraint is violated, proof generation will **fail** — no valid proof can be constructed. The public signals expose only the safe-to-reveal values (amount, address, asset_id) while the Constitution rules (max limit, whitelist config) remain completely private inside the zero-knowledge proof.

## On-Chain Verification

The setup script automatically generates a Solidity verifier at `contracts/contracts/Groth16Verifier.sol`. Deploy this contract to 0G Chain and pass it to the `AgentRegistry` constructor to enable real on-chain proof verification.

## Modifying the Constitution Rules

The constitution and intent are hardcoded in `src/prover.ts` for the hackathon demo. To test a violation, change `intentAmount` to something above `1000` and re-run — proof generation will fail. In production, feed these as runtime inputs from the AI Orchestrator.
