import { SovereignAgent } from "./agent";

/**
 * CLI Script to execute a task for a specific agent.
 * Usage: npx ts-node src/execute-task.ts <agentId> "<instruction>"
 */
async function main() {
    const agent = new SovereignAgent();
    
    const agentIdStr = process.argv[2];
    const instruction = process.argv[3] || "Transfer 100 tokens to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    
    if (!agentIdStr) {
        console.error("Usage: npx ts-node src/execute-task.ts <agentId> \"<instruction>\"");
        process.exit(1);
    }

    const agentId = BigInt(agentIdStr);
    
    console.log(`\n--- SAK Task Execution ---`);
    console.log(`Agent ID: ${agentId}`);
    console.log(`Instruction: ${instruction}`);
    
    try {
        await agent.executeTask(agentId, instruction, "Task successfully verified against constitution and recorded on 0G Chain.");
        console.log(`\n🚀 Task execution completed successfully.`);
    } catch (error) {
        console.error(`\n❌ Task execution failed:`, error);
        process.exit(1);
    }
}

main().catch(console.error);
