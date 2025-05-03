import dotenv from "dotenv";
// Load environment variables
dotenv.config();

export interface EnvConfig {
  HELIUS_HTTPS_URI: string;
  HELIUS_WSS_URI: string;
}

export function validateEnv(): EnvConfig {
  const requiredEnvVars = ["HELIUS_HTTPS_URI", "HELIUS_WSS_URI"] as const;

  const missingVars = requiredEnvVars.filter((envVar) => {
    return !process.env[envVar];
  });

  if (missingVars.length > 0) {
    throw new Error(`🚫 Missing required environment variables: ${missingVars.join(", ")}`);
  }

  const validateUrl = (envVar: string, protocol: string, checkApiKey: boolean = false) => {
    const value = process.env[envVar];
    if (!value) return;

    const url = new URL(value);
    if (value && url.protocol !== protocol) {
      throw new Error(`🚫 ${envVar} must start with ${protocol}`);
    }
    if (checkApiKey && value) {
      const apiKey = url.searchParams.get("api-key");
      if (!apiKey || apiKey.trim() === "") {
        throw new Error(`🚫 The 'api-key' parameter is missing or empty in the URL: ${value}`);
      }
    }
  };

  validateUrl("HELIUS_HTTPS_URI", "https:", true);
  validateUrl("HELIUS_WSS_URI", "wss:", true);

  return {
    HELIUS_HTTPS_URI: process.env.HELIUS_HTTPS_URI!,
    HELIUS_WSS_URI: process.env.HELIUS_WSS_URI!,
  };
}