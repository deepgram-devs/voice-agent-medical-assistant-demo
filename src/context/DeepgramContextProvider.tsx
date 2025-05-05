import { type ReactNode, createContext, useContext, useState, useRef, useEffect } from "react";
import { getApiKey, sendKeepAliveMessage } from "../utils/deepgramUtils";

enum SocketState {
  Unstarted = -1,
  Connecting = 0,
  Connected = 1,
  Failed = 2,
  Closed = 3,
}

interface Context {
  socket: null | WebSocket;
  socketState: SocketState;
  rateLimited: boolean;
  connectToDeepgram: () => Promise<void>;
}

const defaultContext: Context = {
  socket: null,
  socketState: SocketState.Unstarted,
  rateLimited: false,
  connectToDeepgram: async () => { },
};

const DeepgramContext = createContext<Context>(defaultContext);

const DeepgramContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Context["socket"]>(defaultContext.socket);
  const [socketState, setSocketState] = useState<SocketState>(defaultContext.socketState);
  const [rateLimited, setRateLimited] = useState<Context["rateLimited"]>(
    defaultContext.rateLimited,
  );
  const keepAlive = useRef<ReturnType<typeof setTimeout> | undefined>();
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>();
  const maxReconnectAttempts = 5;

  const connectToDeepgram = async (reconnectAttempts: number = 0) => {
    // Clear any existing reconnect timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("Max reconnect attempts reached.");
      setRateLimited(true);
      return;
    }

    // If there's an existing socket, close it properly
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }

    setSocketState(SocketState.Connecting);

    try {
      const newSocket = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
        "token",
        await getApiKey(),
      ]);

      const onOpen = () => {
        setSocketState(SocketState.Connected);
        console.log("WebSocket connected.");
        // Clear any existing keepalive interval
        if (keepAlive.current) {
          clearInterval(keepAlive.current);
        }
        keepAlive.current = setInterval(sendKeepAliveMessage(newSocket), 6000);
      };

      const onError = (err: Event) => {
        setSocketState(SocketState.Failed);
        console.error("Websocket error", err);
      };

      const onClose = () => {
        if (keepAlive.current) {
          clearInterval(keepAlive.current);
        }
        setSocketState(SocketState.Closed);
        console.info("WebSocket closed. Attempting to reconnect...");
        // Use exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectTimeout.current = setTimeout(() => connectToDeepgram(reconnectAttempts + 1), delay);
      };

      const onMessage = () => {
        // console.info("message", e);
      };

      newSocket.binaryType = "arraybuffer";
      newSocket.addEventListener("open", onOpen);
      newSocket.addEventListener("error", onError);
      newSocket.addEventListener("close", onClose);
      newSocket.addEventListener("message", onMessage);

      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setSocketState(SocketState.Failed);
      // Retry connection with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectTimeout.current = setTimeout(() => connectToDeepgram(reconnectAttempts + 1), delay);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (keepAlive.current) {
        clearInterval(keepAlive.current);
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <DeepgramContext.Provider
      value={{
        socket,
        socketState,
        rateLimited,
        connectToDeepgram,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  return useContext(DeepgramContext);
}

export { DeepgramContextProvider, useDeepgram };
