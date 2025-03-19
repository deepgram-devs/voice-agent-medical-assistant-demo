import { convertFloat32ToInt16, downsample } from "../utils/audioUtils";
import nextConfig from "next.config.mjs";

export const getApiKey = async (): Promise<string> => {
  try {
    const result = await (
      await fetch(withBasePath("/api/authenticate"), { method: "POST" })
    ).json();
    return result.key;
  } catch (error) {
    console.error("failed to create API key", error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getApiKey();
  }
};

export const sendMicToSocket = (socket: WebSocket) => (event: AudioProcessingEvent) => {
  const inputData = event?.inputBuffer?.getChannelData(0);
  const downsampledData = downsample(inputData, 48000, 16000);
  const audioDataToSend = convertFloat32ToInt16(downsampledData);
  socket.send(audioDataToSend);
};

export const sendSocketMessage = (socket: WebSocket, message: DGMessage) => {
  socket.send(JSON.stringify(message));
};

export const sendKeepAliveMessage = (socket: WebSocket) => () => {
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

export interface AgentConfig {
  listen: { model: string };
  speak: {
    model: string;
    temp?: number;
    rep_penalty?: number;
  };
  think: {
    provider: { type: string; fallback_to_groq?: boolean };
    model: string;
    instructions: string;
    functions?: LlmFunction[];
  };
}

export interface ContextConfig {
  messages: { role: string; content: string }[];
  replay: boolean;
}

export interface StsConfig {
  type: string;
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
  metadata: {
    accent: string;
    gender: string;
    image: string;
    color: string;
    sample: string;
  };
}

export type DGMessage =
  | { type: "SettingsConfiguration"; audio: AudioConfig; agent: AgentConfig }
  | { type: "UpdateInstructions"; instructions: string }
  | { type: "UpdateSpeak"; model: string }
  | { type: "KeepAlive" }
  | { type: "FunctionCallResponse"; function_call_id: string; output: 'success' | 'error'; error?: string }
  | { type: "FunctionCallRequest"; function_name: string; function_call_id: string; input: Record<string, string | number | boolean> };

export const withBasePath = (path: string): string => {
  const basePath = nextConfig.basePath || "/";
  if (path === "/") return basePath;

  return basePath + path;
};
