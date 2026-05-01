#!/bin/bash

# Exit on error
set -e

echo ">> Creating build directory..."
mkdir -p build

echo ">> Compiling circuit..."
circom constitution.circom --r1cs --wasm --sym -o ./build

echo ">> Generating Powers of Tau..."
snarkjs powersoftau new bn128 12 pot12_0.ptau -v
snarkjs powersoftau contribute pot12_0.ptau pot12_1.ptau --name="SAK" -v -e="sak entropy"
snarkjs powersoftau prepare phase2 pot12_1.ptau pot12_final.ptau -v

echo ">> Setup Groth16..."
snarkjs groth16 setup build/constitution.r1cs pot12_final.ptau circuit_0.zkey
snarkjs zkey contribute circuit_0.zkey circuit_final.zkey --name="SAK Final" -v -e="final entropy"
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

echo ">> Exporting Solidity Verifier..."
snarkjs zkey export solidityverifier circuit_final.zkey ../../contracts/contracts/Verifier.sol

echo "✅ Compilation and setup complete!"
