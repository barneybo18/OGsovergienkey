// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IZKVerifier.sol";

/**
 * @title Verifier
 * @dev Mock Groth16 Verifier for Sovereign Agent Keys hackathon demo.
 * This contract satisfies the IZKVerifier interface and allows the frontend
 * to demonstrate the full end-to-end flow without requiring the circom binary locally.
 */
contract Verifier is IZKVerifier {
    function verify(uint256[] memory, bytes memory) external pure override returns (bool) {
        // MOCK: Always return true to allow the agent mission to succeed in the dashboard.
        return true;
    }
}
