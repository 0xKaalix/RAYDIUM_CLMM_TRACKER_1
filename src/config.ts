export const config = {
    liquidity_pool: [
      
      /*{
        enabled: true,
        id: "rad1",
        name: "Raydium's V4",
        program: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        instruction: "Program log: initialize2: InitializeInstruction2",
      },*/
      {
        enabled: true,
        id: "rad2",
        name: "Raydium's CLMM",
        program: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
        instruction: "Program log: Instruction: CreatePool",
      },/*
      {
        enabled: true,
        id: "rad3",
        name: "Raydium's CPMM",
        program: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
        instruction: " Program log: Instruction: Initialize",
      },*/

    ],
    wsol_pc_mint: "So11111111111111111111111111111111111111112",
    axios: {
      get_timeout: 10000, // Timeout for API requests
    },
  };