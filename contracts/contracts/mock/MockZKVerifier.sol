// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IZKVerifier.sol";

/**
 * @title MockZKVerifier
 * @dev A mock verifier for local testing that always returns true for any proof.
 * Used during the transition from mock to real ZK.
 */
contract MockZKVerifier is IZKVerifier {
    function verifyProof(
        uint[2] memory /*pA*/,
        uint[2][2] memory /*pB*/,
        uint[2] memory /*pC*/,
        uint[4] memory /*pubSignals*/
    ) external pure override returns (bool) {
        return true;
    }
}
