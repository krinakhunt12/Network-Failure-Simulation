export class NetworkError extends Error {
  public readonly url: string;
  public readonly status?: number;
  public readonly statusText?: string;
  public readonly isSimulated: boolean;

  constructor(
    message: string,
    options: { url: string; status?: number; statusText?: string; isSimulated?: boolean } = {
      url: "",
      isSimulated: true,
    }
  ) {
    super(message);
    this.name = "NetworkError";
    this.url = options.url;
    this.status = options.status;
    this.statusText = options.statusText;
    this.isSimulated = options.isSimulated ?? true;
  }
}
