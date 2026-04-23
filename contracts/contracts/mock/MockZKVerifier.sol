// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IZKVerifier.sol";

/**
 * @title MockZKVerifier
 * @dev A mock Groth16 verifier for hackathon MVP speed.
 *      Accepts any proof where all points are non-zero.
 *      Replace with the auto-generated Groth16Verifier.sol from snarkjs for production.
 */
contract MockZKVerifier is IZKVerifier {

    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external pure override returns (bool) {
        // Basic sanity: proof points must be non-zero
        require(_pA[0] != 0 || _pA[1] != 0, "Proof point A is zero");
        require(_pubSignals[3] == 1, "Circuit output 'valid' must be 1");
        
        // Suppress unused variable warnings
        _pB;
        _pC;

        // In production: this is replaced by the real pairing check from Groth16Verifier.sol
        return true;
    }
}
