export interface MoMoRequestToPayResponse {
  referenceId: string;
}

export interface MoMoTransactionStatus {
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  financialTransactionId?: string;
  reason?: { code: string; message: string };
}

export interface MoMoCallbackPayload {
  externalId: string;
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  financialTransactionId?: string;
}
