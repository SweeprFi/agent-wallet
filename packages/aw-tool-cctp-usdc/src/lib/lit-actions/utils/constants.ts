export enum SupportedChainId {
  // Testnets
  ETH_SEPOLIA = 11155111,
  AVAX_FUJI = 43113,
  BASE_SEPOLIA = 84532,
  LINEA_SEPOLIA = 59141,

  // Mainnets
  ETH = 1,
  AVAX = 43114,
  BASE = 8453,
  LINEA = 59144
}

const Testnets = [
  SupportedChainId.ETH_SEPOLIA,
  SupportedChainId.AVAX_FUJI,
  SupportedChainId.BASE_SEPOLIA,
  SupportedChainId.LINEA_SEPOLIA,
];

// Returns TRUE if chains are on same network
export const checkNetwork = (srcChainId: number, dstChainId: number) => {
  const isSrcTestnet = Testnets.includes(srcChainId);
  const isDstTestnet = Testnets.includes(dstChainId);

  return (isSrcTestnet && isDstTestnet) || (!isSrcTestnet && !isDstTestnet);
};

export const DEFAULT_MAX_FEE = 1000n;
export const DEFAULT_FINALITY_THRESHOLD = 2000;

export const CHAIN_IDS_TO_USDC_ADDRESSES: Record<number, string> = {
  [SupportedChainId.ETH_SEPOLIA]: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
  [SupportedChainId.AVAX_FUJI]: "0x5425890298aed601595a70AB815c96711a31Bc65",
  [SupportedChainId.BASE_SEPOLIA]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [SupportedChainId.LINEA_SEPOLIA]: "0xFEce4462D57bD51A6A552365A011b95f0E16d9B7",
  // ---------------------
  [SupportedChainId.ETH]: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  [SupportedChainId.AVAX]: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  [SupportedChainId.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [SupportedChainId.LINEA]: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
};

export const CHAIN_IDS_TO_TOKEN_MESSENGER: Record<number, string> = {
  [SupportedChainId.ETH_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  [SupportedChainId.AVAX_FUJI]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  [SupportedChainId.BASE_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  [SupportedChainId.LINEA_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  // ---------------------
  [SupportedChainId.ETH]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  [SupportedChainId.AVAX]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  [SupportedChainId.BASE]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  [SupportedChainId.LINEA]: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
};

export const CHAIN_IDS_TO_MESSAGE_TRANSMITTER: Record<number, string> = {
  [SupportedChainId.ETH_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  [SupportedChainId.AVAX_FUJI]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  [SupportedChainId.BASE_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  [SupportedChainId.LINEA_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  // ---------------------
  [SupportedChainId.ETH]: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64",
  [SupportedChainId.AVAX]: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64",
  [SupportedChainId.BASE]: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64",
  [SupportedChainId.LINEA]: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64",
};

export const DESTINATION_DOMAINS: Record<number, number> = {
  [SupportedChainId.ETH_SEPOLIA]: 0,
  [SupportedChainId.AVAX_FUJI]: 1,
  [SupportedChainId.BASE_SEPOLIA]: 6,
  [SupportedChainId.LINEA_SEPOLIA]: 11,
  // ---------------------
  [SupportedChainId.ETH]: 0,
  [SupportedChainId.AVAX]: 1,
  [SupportedChainId.BASE]: 6,
  [SupportedChainId.LINEA]: 11,
};

export const API_URL: Record<number, string> = {
  [SupportedChainId.ETH_SEPOLIA]: "https://iris-api-sandbox.circle.com",
  [SupportedChainId.AVAX_FUJI]: "https://iris-api-sandbox.circle.com",
  [SupportedChainId.BASE_SEPOLIA]: "https://iris-api-sandbox.circle.com",
  [SupportedChainId.LINEA_SEPOLIA]: "https://iris-api-sandbox.circle.com",
  // ---------------------
  [SupportedChainId.ETH]: "https://iris-api.circle.com",
  [SupportedChainId.AVAX]: "https://iris-api.circle.com",
  [SupportedChainId.BASE]: "https://iris-api.circle.com",
  [SupportedChainId.LINEA]: "https://iris-api.circle.com",
};