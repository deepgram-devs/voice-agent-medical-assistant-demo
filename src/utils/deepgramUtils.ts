import { convertFloat32ToInt16, downsample } from "../utils/audioUtils";

export const getApiKey = async (): Promise<string> => {
  const apiKey = (window as any).process?.env?.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is not set");
  }
  return apiKey;
};

export const sendMicToSocket = (socket: WebSocket) => (event: AudioProcessingEvent) => {
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket is not open, skipping audio data send');
    return;
  }
  const inputData = event?.inputBuffer?.getChannelData(0);
  const downsampledData = downsample(inputData, 48000, 16000);
  const audioDataToSend = convertFloat32ToInt16(downsampledData);
  socket.send(audioDataToSend);
};

export const sendSocketMessage = (socket: WebSocket, message: DGMessage) => {
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket is not open, skipping message send:', message);
    return;
  }
  socket.send(JSON.stringify(message));
};

export const sendKeepAliveMessage = (socket: WebSocket) => () => {
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket is not open, skipping keepalive');
    return;
  }
  sendSocketMessage(socket, { type: "KeepAlive" });
};

export interface AudioConfig {
  input: {
    encoding: string;
    sample_rate: number;
  };
  output: {
    encoding: string;
    sample_rate: number;
    container?: string;
    buffer_size?: number;
  };
}

export interface ProviderConfig {
  type: string;
  model?: string;
  model_id?: string;
  voice?: {
    mode: string;
    id: string;
  };
  language?: string;
  language_code?: string;
  temperature?: number;
  endpoint?: {
    url: string;
    headers: Record<string, string>;
  };
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  endpoint?: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
}

export interface AgentConfig {
  language?: string;
  listen: {
    provider: ProviderConfig;
  };
  think: {
    provider: ProviderConfig;
    prompt: string;
    instructions?: string;
    functions?: FunctionDefinition[];
  };
  speak: {
    provider: ProviderConfig;
  };
  greeting?: string;
}

export interface ContextConfig {
  messages: { role: string; content: string }[];
  replay: boolean;
}

export interface StsConfig {
  type: string;
  experimental?: boolean;
  mip_opt_out?: boolean;
  audio: AudioConfig;
  agent: AgentConfig;
  context?: ContextConfig;
}

export interface LlmFunction {
  name: string;
  description: string;
  url?: string;
  method?: string;
  headers?: Header[];
  key?: string;
  parameters: LlmParameterObject | Record<string, never>;
}

export type LlmParameter = LlmParameterScalar | LlmParameterObject;

export interface LlmParameterBase {
  type: string;
  description?: string;
}

export interface LlmParameterObject extends LlmParameterBase {
  type: "object";
  properties: Record<string, LlmParameter>;
  required?: string[];
}

export interface LlmParameterScalar extends LlmParameterBase {
  type: "string" | "integer";
}

export interface Header {
  key: string;
  value: string;
}

export interface Voice {
  name: string;
  canonical_name: string;
  provider: {
    type: string;
    model: string;
  };
  metadata: {
    accent: string;
    gender: string;
    image: string;
    color: string;
    sample: string;
  };
}

export type DGMessage =
  | {
    type: "Settings";
    experimental?: boolean;
    mip_opt_out?: boolean;
    audio: AudioConfig;
    agent: AgentConfig
  }
  | { type: "UpdateInstructions"; prompt: string }
  | { type: "UpdateSpeak"; provider: ProviderConfig }
  | { type: "KeepAlive" }
  | {
    type: "FunctionCallRequest";
    functions: Array<{
      id: string;
      name: string;
      arguments: string;
      client_side: boolean;
    }>;
  }
  | {
    type: "FunctionCallResponse";
    id: string;
    name: string;
    content: string;
  };

export const withBasePath = (path: string): string => {
  // In Vite, we don't need to handle basePath as it's handled by the dev server
  return path;
};
