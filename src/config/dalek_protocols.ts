export const DALEK_PROTOCOLS = {
  MAX_RETRY_THRESHOLD: 5,
  SYSTEM_NAME: 'DALEK_GROG_V1',
  QUOTA_WARNING_LEVEL: 0.85,
  PURGE_MODE: true
};

export type ProtocolKey = keyof typeof DALEK_PROTOCOLS;