/** Thrown when the server is missing the configuration to talk to a provider. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}
