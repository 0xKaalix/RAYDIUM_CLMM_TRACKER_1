import { Connection,ParsedAccountData, PublicKey } from "@solana/web3.js";
import { validateEnv } from "../env-validator";
import { config } from "../../config";

// Constants
const WSOL_MINT = config.wsol_pc_mint;

/**
 * SignatureHandler class optimized for speed
 */
export class SignatureHandler {
  private connection: Connection;

  constructor(connection?: Connection) {
    const env = validateEnv();
    this.connection = connection || new Connection(env.HELIUS_HTTPS_URI, "confirmed");
  }

  /**
   * Get the mint address from a transaction signature - optimized for speed
   * @param signature Transaction signature
   * @returns Promise resolving to mint address or null
   */
  public async getMintFromSignature(signature: string): Promise<string | null> {
    if (!signature || typeof signature !== "string" || signature.trim() === "") {
      return null; // Invalid signature, return null immediately
    }

    try {
      // Fetch transaction with minimal options
      let tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      // Quick validation with retry
      if (!tx?.meta) {
        // Wait 200ms and try one more time
        await new Promise((resolve) => setTimeout(resolve, 200));
        tx = await this.connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        });

        // If still no meta data, return null
        if (!tx?.meta) return null;
      }

      // Get token balances - prefer postTokenBalances as they're more likely to contain the new token
      const tokenBalances = tx.meta.postTokenBalances || tx.meta.preTokenBalances;
      if (!tokenBalances?.length) return null;

      // Fast path: If we have exactly 2 token balances, one is likely WSOL and the other is the token
      if (tokenBalances.length === 2) {
        const mint1 = tokenBalances[0].mint;
        const mint2 = tokenBalances[1].mint;

        // If mint1 is WSOL, return mint2 (unless it's also WSOL)
        if (mint1 === WSOL_MINT) {
          return mint2 === WSOL_MINT ? null : mint2;
        }

        // If mint2 is WSOL, return mint1
        if (mint2 === WSOL_MINT) {
          return mint1;
        }

        // If neither is WSOL, return the first one
        return mint1;
      }

      // For more than 2 balances, find the first non-WSOL mint
      for (const balance of tokenBalances) {
        if (balance.mint !== WSOL_MINT) {
          return balance.mint;
        }
      }

      // If we only found WSOL mints, return null
      return null;
    } catch (error) {
      // Minimal error logging for speed
      return null;
    }
  }

  public async getTokenMints(signature: string): Promise<{ tokenA: string, tokenB: string } | null> {
    const tx = await this.connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx?.meta) return null;
  
    const postBalances = tx.meta.postTokenBalances || [];
    if (postBalances.length < 2) return null;
  
    return {
      tokenA: postBalances[0].mint,
      tokenB: postBalances[1].mint,
    };
  }

  public async getTokenAccountBalance(accountPubkey: string): Promise<number> {
    try {
      const accountInfo = await this.connection.getParsedAccountInfo(new PublicKey(accountPubkey));

      const data = accountInfo.value?.data;

      if (data && typeof data !== "string" && "parsed" in data) {
        const parsedInfo = (data as ParsedAccountData).parsed?.info;

        // Some tokens have decimals, some don’t
        const uiAmount = parsedInfo?.tokenAmount?.uiAmount;
        const amount = parsedInfo?.tokenAmount?.amount;
        const decimals = parsedInfo?.tokenAmount?.decimals;

        // Debug: You can temporarily log to see what's returned
        // console.log("Parsed Token Info:", parsedInfo);

        if (uiAmount !== undefined) return uiAmount;
        if (amount && decimals !== undefined) return Number(amount) / Math.pow(10, decimals);
      }

      return 0;
    } catch (error) {
      console.log(`Error fetching token account balance for ${accountPubkey}:`, error);
      return 0;
    }
  }
  
  

}

// Create a singleton instance for better performance
const signatureHandler = new SignatureHandler();

/**
 * Get the mint address from a transaction signature (optimized for speed)
 * @param signature Transaction signature
 * @returns Mint address or null
 */
export async function getMintFromSignature(signature: string): Promise<string | null> {
  return signatureHandler.getMintFromSignature(signature);
}

export async function  getTokenMints(signature: string): Promise<{ tokenA: string, tokenB: string } | null> {
  return signatureHandler.getTokenMints(signature)
}  

export async function getTokenAccountBalance(tokenAddr: string): Promise<number> {
  return signatureHandler.getTokenAccountBalance(tokenAddr);
}  