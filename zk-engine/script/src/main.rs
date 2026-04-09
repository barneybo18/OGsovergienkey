//! The Sovereign Agent Prover Script
//! This script acts on behalf of the AI to prove its intent lies within the Constitution Rules.

use sp1_sdk::{ProverClient, SP1Stdin};
use serde::{Deserialize, Serialize};

/// The ELF executable of the guest program we just compiled.
const SOVEREIGN_AGENT_ELF: &[u8] = include_bytes!("../../program/elf/riscv32im-succinct-zkvm-elf");

// Define structures matching the guest program
#[derive(Serialize, Deserialize, Debug)]
struct ConstitutionConfig {
    pub max_spend_limit: u64,
    pub whitelisted_address: [u8; 20],
}

#[derive(Serialize, Deserialize, Debug)]
struct AgentIntent {
    pub intent_amount: u64,
    pub target_address: [u8; 20],
    pub asset_id: u32,
    pub signature: [u8; 64],
}

fn main() {
    // 1. Setup the client and ZK environment
    let client = ProverClient::new();
    let mut stdin = SP1Stdin::new();

    // 2. Define the Constitution constraints (Max 1000 tokens, specific address)
    let config = ConstitutionConfig {
        max_spend_limit: 1000,
        whitelisted_address: [
            0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ],
    };

    // 3. Define the AI intent (800 tokens, matching address limit)
    let intent = AgentIntent {
        intent_amount: 800, // Valid! Since 800 <= 1000
        target_address: config.whitelisted_address, // Valid! Address matches
        asset_id: 1,
        signature: [0u8; 64],
    };

    // 4. Write data to the SP1 ZKVM stdin
    stdin.write(&config);
    stdin.write(&intent);

    println!("Starting SP1 Prover for Sovereign Agent intent...");
    
    // 5. Generate the Proof (This is computationally heavy and represents the core ZK action)
    let (pk, vk) = client.setup(SOVEREIGN_AGENT_ELF);
    let mut proof = client.prove(&pk, stdin).run().expect("Proving failed");

    println!("✅ Proof generated successfully! The Agent followed the Constitution.");

    // 6. Extract the public journal (what we broadcast to the 0G Network)
    let proven_amount = proof.public_values.read::<u64>();
    let proven_address = proof.public_values.read::<[u8; 20]>();
    
    println!("Public Journal reads amount: {}", proven_amount);
    println!("Public Journal reads target address: {:?}", proven_address);
    
    // 7. Verification check
    client.verify(&proof, &vk).expect("Verification failed");
    println!("✅ Verification successful.");
}
