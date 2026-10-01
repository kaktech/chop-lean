declare module "@paystack/inline-js" {
  export default class PaystackPop {
    resumeTransaction(
      accessCode: string,
      callbacks?: { onSuccess?: (tx: { reference?: string }) => void; onCancel?: () => void; onError?: (e: unknown) => void },
    ): void;
  }
}
