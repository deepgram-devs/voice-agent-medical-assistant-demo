"use client";

import { type ReactNode, createContext, useContext, useState, useRef } from "react";
import { getApiKey, sendKeepAliveMessage } from "app/utils/deepgramUtils";

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
  connectToDeepgram: async () => {},
};

const DeepgramContext = createContext<Context>(defaultContext);

const DeepgramContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Context["socket"]>(defaultContext.socket);
  const [socketState, setSocketState] = useState<SocketState>(defaultContext.socketState);
  const [rateLimited, setRateLimited] = useState<Context["rateLimited"]>(
    defaultContext.rateLimited,
  );
  const keepAlive = useRef<ReturnType<typeof setTimeout> | undefined>();
  const maxReconnectAttempts = 5;

  const connectToDeepgram = async (reconnectAttempts: number = 0) => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("Max reconnect attempts reached.");
      // we don't actually know this is a rate limit, but want to show this anyways
      setRateLimited(true);
      return;
    }

    setSocketState(SocketState.Connecting);

    const newSocket = new WebSocket("wss://agent.deepgram.com/agent", [
      "token",
      await getApiKey(),
    ]);

    const onOpen = () => {
      setSocketState(SocketState.Connected);
      console.log("WebSocket connected.");
      keepAlive.current = setInterval(sendKeepAliveMessage(newSocket), 6000);
    };

    const onError = (err: Event) => {
      setSocketState(SocketState.Failed);
      console.error("Websocket error", err);
    };

    const onClose = () => {
      clearInterval(keepAlive.current);
      setSocketState(SocketState.Closed);
      console.info("WebSocket closed. Attempting to reconnect...");
      setTimeout(() => connectToDeepgram(reconnectAttempts + 1), 3000); // reconnect after 3 seconds
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
  };

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
