import WebSocket from "ws"; // Node.js websocket library
import { config } from "./config"; // Configuration parameters for our bot
import { validateEnv } from "./utils/env-validator";
import { WebSocketManager, ConnectionState, WebSocketRequest } from "./utils/managers/websocketManager";
import { getMintFromSignature } from "./utils/handlers/signatureHandler";
import { saveMemecoinData ,MemecoinData} from "./firebase/saveTokenData";

const SUBSCRIBE_LP = config.liquidity_pool;


// Function used to handle the transaction once a new pool creation is found
async function processTransaction(signature: string): Promise<void> {
  console.log("================================================================");
  console.log("💦 [Process Transaction] New Liquidity Pool signature found");
  console.log("⌛ [Process Transaction] Extracting token CA from signature...");
  console.log("https://solscan.io/tx/" + signature);

  const returnedMint = await getMintFromSignature(signature);
  

  if (!returnedMint) {


    console.log("❌ [Process Transaction] No valid token CA could be extracted");
    console.log("🔎 [Process Transaction] Looking for new Liquidity Pools again\n");
    return;
  }
  console.log("✅ [Process Transaction] Token CA extracted successfully");
  console.log("✅ [Process Transaction] Memecoin Token Address :-"+ returnedMint);
  console.log("👽 GMGN: https://gmgn.ai/sol/token/" + returnedMint);

  const memecoinData: MemecoinData = {
    memecoin_GMGN_Link: `https://gmgn.ai/sol/token/${returnedMint}`,  // Set the actual link
    time: new Date(),  // Current Unix timestamp in milliseconds
  };
  await saveMemecoinData(memecoinData);
  return;
}
  

// Main function to start the application
async function main(): Promise<void> {
  console.clear();
  console.log("🚀 Starting Solana Token Sniper...");


  // Load environment variables from the .env file
  const env = validateEnv();

  // Create WebSocket manager
  const wsManager = new WebSocketManager({
    url: env.HELIUS_WSS_URI,
    initialBackoff: 1000,
    maxBackoff: 30000,
    maxRetries: Infinity,
    debug: true,
  });

  // Set up event handlers
  wsManager.on("open", () => {
    /**
     * Create a new subscription request for each program ID
     */
    SUBSCRIBE_LP.filter((pool) => pool.enabled).forEach((pool) => {
      const subscriptionMessage = {
        jsonrpc: "2.0",
        id: pool.id,
        method: "logsSubscribe",
        params: [
          {
            mentions: [pool.program],
          },
          {
            commitment: "processed", // Can use finalized to be more accurate.
          },
        ],
      };
      wsManager.send(JSON.stringify(subscriptionMessage));
    });
  });

  wsManager.on("message", async (data: WebSocket.Data) => {
    try {
      const jsonString = data.toString(); // Convert data to a string
      const parsedData = JSON.parse(jsonString); // Parse the JSON string

      // Handle subscription response
      if (parsedData.result !== undefined && !parsedData.error) {
        console.log("✅ Subscription confirmed");
        return;
      }

      // Only log RPC errors for debugging
      if (parsedData.error) {
        console.error("🚫 RPC Error:", parsedData.error);
        return;
      }
     
      // Safely access the nested structure
      const logs = parsedData?.params?.result?.value?.logs;
      const signature = parsedData?.params?.result?.value?.signature;

      //console.log("================= LOGS ==============================");
      //console.log(logs);
      // Validate `logs` is an array and if we have a signtature
      if (!Array.isArray(logs) || !signature) return;

      // Verify if this is a new pool creation
      const liquidityPoolInstructions = SUBSCRIBE_LP.filter((pool) => pool.enabled).map((pool) => pool.instruction);
      const containsCreate = logs.some((log: string) => typeof log === "string" && liquidityPoolInstructions.some((instruction) => log.includes(instruction)));

      if (!containsCreate || typeof signature !== "string") return;
      
      // Process transaction asynchronously
      processTransaction(signature)
        .catch((error) => {
          console.error("Error processing transaction:", error);
        });
    } catch (error) {
      console.error("💥 Error processing message:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  wsManager.on("error", (error: Error) => {
    console.error("WebSocket error:", error.message);
  });

  wsManager.on("state_change", (state: ConnectionState) => {
    if (state === ConnectionState.RECONNECTING) {
      console.log("📴 WebSocket connection lost, attempting to reconnect...");
    } else if (state === ConnectionState.CONNECTED) {
      console.log("🔄 WebSocket reconnected successfully.");
    }
  });

  // Start the connection
  wsManager.connect();

  // Handle application shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    wsManager.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down...");
    wsManager.disconnect();
    process.exit(0);
  }); 
}

// Start the application
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});