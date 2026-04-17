import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from ai-orchestrator since that's where the user pointed
dotenv.config({ path: path.join(__dirname, "../ai-orchestrator/.env") });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris", // Recommended for 0G EVM compatibility
    },
  },
  networks: {
    "0g-testnet": {
      url: process.env.RPC_ENDPOINT || "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [PRIVATE_KEY],
      gasPrice: 5000000000,
      maxPriorityFeePerGas: 5000000000
    },
    hardhat: {
      chainId: 1337
    }
  }
};

export default config;
