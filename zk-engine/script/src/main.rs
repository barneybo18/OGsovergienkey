//! The Sovereign Agent Prover Script
//! This script acts on behalf of the AI to prove its intent lies within the Constitution Rules.

use sp1_sdk::{Elf, Prover, ProvingKey, ProverClient, SP1Stdin};
use serde::{Deserialize, Serialize};
use std::fs;

/// The ELF executable of the guest program we just compiled.
const SOVEREIGN_AGENT_ELF: &[u8] = include_bytes!("../../target/elf-compilation/riscv64im-succinct-zkvm-elf/release/sovereign-agent-program");

// Define structures matching the guest program
#[derive(Serialize, Deserialize, Debug)]
struct ConstitutionConfig {
    pub max_spend_limit: u64,
    pub whitelisted_address: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
struct AgentIntent {
    pub intent_amount: u64,
    pub target_address: Vec<u8>,
    pub asset_id: u32,
    pub signature: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
struct ProverOutput {
    pub proof: String,         // hex-encoded bincode proof
    pub public_values: String, // hex-encoded public journal bytes
    pub amount: u64,
    pub target: Vec<u8>,
}

#[tokio::main]
async fn main() {
    // 1. Setup the client — from_env() is async in SP1 v6.x
    let client = ProverClient::from_env().await;
    let mut stdin = SP1Stdin::new();

    // 2. Load inputs from JSON
    println!("Loading inputs from zk_input.json...");
    let input_data = fs::read_to_string("zk_input.json").expect("Unable to read zk_input.json");
    let input_json: serde_json::Value = serde_json::from_str(&input_data).expect("JSON was not well-formatted");

    let config: ConstitutionConfig = serde_json::from_value(input_json["config"].clone()).expect("Invalid config in JSON");
    let intent: AgentIntent = serde_json::from_value(input_json["intent"].clone()).expect("Invalid intent in JSON");

    // 3. Write data to the SP1 ZKVM stdin
    stdin.write(&config);
    stdin.write(&intent);

    println!("Starting SP1 Prover for Sovereign Agent intent...");

    // 4. Setup proving key — SP1 v6.x: setup(Elf::Static(...)) is async,
    //    returns a single ProvingKey (vk is accessed via pk.verifying_key())
    let pk = client
        .setup(Elf::Static(SOVEREIGN_AGENT_ELF))
        .await
        .expect("Setup failed");
    let vk = pk.verifying_key().clone();

    // 5. Generate the proof — EnvProveRequest implements IntoFuture, so .await directly
    let mut proof = client
        .prove(&pk, stdin)
        .await
        .expect("Proving failed");

    println!("✅ Proof generated successfully! The Agent followed the Constitution.");

    // 6. Extract the public journal
    let proven_amount = proof.public_values.read::<u64>();
    let proven_address = proof.public_values.read::<Vec<u8>>();

    println!("Public Journal reads amount: {}", proven_amount);

    // 7. Verification — skip in mock mode (mock proofs have no cryptographic content)
    //    SP1_PROVER=mock is used for pipeline testing without real ZK computation.
    let prover_mode = std::env::var("SP1_PROVER").unwrap_or_else(|_| "cpu".to_string());
    if prover_mode != "mock" {
        client.verify(&proof, &vk, None).expect("Verification failed");
        println!("✅ Verification successful.");
    } else {
        println!("⚠️  Mock mode: skipping cryptographic verification (proof has no real content).");
        println!("✅ Pipeline validated successfully in mock mode.");
    }

    // 8. Save output to JSON for Orchestrator
    let proof_bytes = bincode::serialize(&proof).expect("Failed to serialize proof");
    let output = ProverOutput {
        proof: hex::encode(&proof_bytes),
        public_values: hex::encode(proof.public_values.as_slice()),
        amount: proven_amount,
        target: proven_address,
    };

    let output_json = serde_json::to_string_pretty(&output).expect("Failed to serialize output");
    fs::write("zk_output.json", output_json).expect("Unable to write zk_output.json");
    println!("✅ Prover output saved to zk_output.json");
}
