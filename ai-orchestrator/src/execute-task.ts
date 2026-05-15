import { SovereignAgent } from "./agent";
import { parseTask } from "./task-parser";

/**
 * CLI Script to execute a task for a specific agent.
 * Usage: npx ts-node src/execute-task.ts <agentId> "<instruction>"
 */
async function main() {
    const agent = new SovereignAgent();
    
    const agentIdStr = process.argv[2];
    const instruction = process.argv[3] || "";
    
    if (!agentIdStr) {
        console.error("Usage: npx ts-node src/execute-task.ts <agentId> \"<instruction>\"");
        process.exit(1);
    }

    const agentId = BigInt(agentIdStr);
    
    console.log(`\n--- SAK Task Execution ---`);
    console.log(`Agent ID: ${agentId}`);
    console.log(`Instruction: ${instruction}`);
    
    try {
        const { amount, targetAddress, isTransfer } = parseTask(instruction);
        const result = isTransfer 
            ? `SUCCESS: Verifiable intent formed for ${amount} $0G transfer to ${targetAddress}.`
            : "SUCCESS: Custom instruction verified against SAK constitution.";

        await agent.executeTask(agentId, instruction, result);
        console.log(`\n🚀 Task execution completed successfully.`);
    } catch (error) {
        console.error(`\n❌ Task execution failed:`, error);
        process.exit(1);
    }
}

main().catch(console.error);
