export interface MoMoRequestToPayResponse {
  referenceId: string;
}

export interface MoMoTransactionStatus {
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  financialTransactionId?: string;
  // Verified against the MTN sandbox: `reason` comes back as a string enum
  // (e.g. "APPROVAL_REJECTED"). Some MTN docs show an object, so accept both.
  reason?: string | { code?: string; message?: string };
}

export interface MoMoCallbackPayload {
  externalId: string;
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  financialTransactionId?: string;
}
