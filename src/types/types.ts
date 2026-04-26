export type StreamMessage =
  | { type: "ai"; payload: { text: string } }
  | {
      type: "toolCall:start";
      payload: { name: string; args: Record<string, any> };
      chartData?: any[];
    }
  | {
      type: "tool";
      name: string;
      result: Record<string, any>;
    }
  | {
      type: "toolCall:end";
      payload: {
        name: string;
        result: {
          status: "success" | "failed";
          from?: string;
          to?: string;
          groupBy?: "day" | "week" | "month" | "year";
          chartData?: any[];
          message?: string;
          [key: string]: any;
        };
      };
    }
  | {
      type: "toolCall:error";
      payload: {
        name: string;
        error: string;
      };
    };

export type GOOGLE_AUTH_KEYS =
  | "client_id"
  | "client_secret"
  | "endpoint"
  | "redirect_uri"
  | "scopes";
