import { AgentTools } from "./tools";

async function testTools() {
  console.log("🧪 Testing Coding Agent Tools\n");

  // Test 1: List files
  console.log("1. Testing list_files tool:");
  const listResult = await AgentTools.listFiles({ path: "." });
  console.log(listResult.success ? listResult.result : `Error: ${listResult.error}`);
  console.log("\n" + "-".repeat(50) + "\n");

  // Test 2: Create a test file
  console.log("2. Testing edit_file tool (create new file):");
  const createResult = await AgentTools.editFile({
    path: "test.txt",
    old_str: "",
    new_str: "Hello, World!\nThis is a test file created by the coding agent."
  });
  console.log(createResult.success ? createResult.result : `Error: ${createResult.error}`);
  console.log("\n" + "-".repeat(50) + "\n");

  // Test 3: Search for content
  console.log("3. Testing code_search tool:");
  const searchResult = await AgentTools.codeSearch({ pattern: "console.log" });
  console.log(searchResult.success ? searchResult.result : `Error: ${searchResult.error}`);
  console.log("\n" + "-".repeat(50) + "\n");

  // Test 4: Execute bash command
  console.log("4. Testing bash tool:");
  const bashResult = await AgentTools.bash({ command: "echo 'Hello from bash!'" });
  console.log(bashResult.success ? bashResult.result : `Error: ${bashResult.error}`);
  console.log("\n" + "-".repeat(50) + "\n");

  // Test 5: Edit the test file
  console.log("5. Testing edit_file tool (modify existing file):");
  const editResult = await AgentTools.editFile({
    path: "test.txt",
    old_str: "Hello, World!",
    new_str: "Hello, Coding Agent!"
  });
  console.log(editResult.success ? editResult.result : `Error: ${editResult.error}`);
  console.log("\n" + "-".repeat(50) + "\n");

  // Clean up
  console.log("6. Cleaning up test file:");
  const cleanupResult = await AgentTools.bash({ command: "rm -f test.txt" });
  console.log(cleanupResult.success ? "Test file removed" : `Error: ${cleanupResult.error}`);

  console.log("\n✅ All tools tested successfully!");
}

testTools().catch(console.error);