// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IZKVerifier.sol";

/**
 * @title MockZKVerifier
 * @dev A mock verifier for the hackathon MVP frontend speed. 
 * Ultimately replaced by the real Succinct / RISC Zero verifier.
 */
contract MockZKVerifier is IZKVerifier {
    
    // Simulate accepting any non-empty proof for the MVP setup
    function verify(uint256[] memory /*pubInputs*/, bytes memory proof) external pure override returns (bool) {
        require(proof.length > 0, "Proof cannot be empty");
        // In production: verify proof logic here
        return true;
    }
}
