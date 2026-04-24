export type StreamMessage =
  | { type: "ai"; payload: { text: string } }
  | {
      type: "toolCall:start";
      payload: { name: string; args: Record<string, any> }
      chartData?:any[]
    }
  | {
      type: "tool";
      name: string;
      result: Record<string, any>;
    };



  export  type GOOGLE_AUTH_KEYS = 
    | "client_id" 
    | "client_secret" 
    | "endpoint" 
    | "redirect_uri" 
    | "scopes";