import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Use Mock Private keys or load from .env for real deployment
const PRIVATE_KEY = "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 0G Newton Testnet Placeholder Config
    // Refer to 0G Official documentation for exact EVM chain ID and RPC
    "0g-testnet": {
      url: "https://rpc-testnet.0g.ai", // Replace with official RPC
      chainId: 16600, // Replace with official Chain ID if different
      accounts: [PRIVATE_KEY]
    },
    hardhat: {
      chainId: 1337
    }
  }
};

export default config;
