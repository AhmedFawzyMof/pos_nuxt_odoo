import axios, { type AxiosInstance } from "axios";

interface Config {
  baseUrl: string;
  db: string;
  username: string;
  password: string;
}

export class JsonClient {
  private api: AxiosInstance;
  private creds: Config;
  // private uid: number | null = null;

  constructor(creds: Config) {
    this.creds = creds;
    this.api = axios.create({
      baseURL: creds.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  private async rpcCall(endpoint: string, method: string, params: any) {
    const payload = {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: Math.floor(Math.random() * 100000),
    };

    const response = await this.api.post(endpoint, payload);
    if (response.data.error) {
      throw new Error(
        response.data.error.data?.message || response.data.error.message,
      );
    }
    return response.data.result;
  }

  async login(): Promise<number> {
    const params = {
      db: this.creds.db,
      login: this.creds.username,
      password: this.creds.password,
    };

    const uid = await this.rpcCall("/jsonrpc", "authenticate", params);

    if (!uid) {
      throw new Error("Invalid email or password for this company account.");
    }

    return uid;
  }

  async executeKw(
    uid: number,
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {},
  ) {
    const params = {
      service: "object",
      method: "execute_kw",
      args: [
        this.creds.db,
        uid,
        this.creds.password,
        model,
        method,
        args,
        kwargs,
      ],
    };
    return await this.rpcCall("/jsonrpc", "execute", params);
  }
}
