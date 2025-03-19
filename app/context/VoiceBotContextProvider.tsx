"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  voiceBotReducer,
  INCREMENT_SLEEP_TIMER,
  START_SPEAKING,
  START_LISTENING,
  START_SLEEPING,
  ADD_MESSAGE,
  SET_PARAMS_ON_COPY_URL,
  ADD_BEHIND_SCENES_EVENT,
} from "./VoiceBotReducer";

const defaultSleepTimeoutSeconds = 30;

export enum EventType {
  SETTINGS_APPLIED = "SettingsApplied",
  AGENT_AUDIO_DONE = "AgentAudioDone",
  USER_STARTED_SPEAKING = "UserStartedSpeaking",
  AGENT_STARTED_SPEAKING = "AgentStartedSpeaking",
  CONVERSATION_TEXT = "ConversationText",
  END_OF_THOUGHT = "EndOfThought",
}

export type VoiceBotMessage = LatencyMessage | ConversationMessage;

export type LatencyMessage = {
  total_latency: number | null;
  tts_latency: number;
  ttt_latency: number;
};
export type ConversationMessage = UserMessage | AssistantMessage;

export type UserMessage = { user: string };
export type AssistantMessage = { assistant: string };

export type BehindTheScenesEvent =
  | { type: EventType.SETTINGS_APPLIED }
  | { type: EventType.USER_STARTED_SPEAKING }
  | { type: EventType.AGENT_STARTED_SPEAKING }
  | { type: EventType.CONVERSATION_TEXT; role: "user" | "assistant"; content: string }
  | { type: "Interruption" }
  | { type: EventType.END_OF_THOUGHT };

export const isConversationMessage = (
  voiceBotMessage: VoiceBotMessage,
): voiceBotMessage is ConversationMessage =>
  isUserMessage(voiceBotMessage as UserMessage) ||
  isAssistantMessage(voiceBotMessage as AssistantMessage);

export const isLatencyMessage = (
  voiceBotMessage: VoiceBotMessage,
): voiceBotMessage is LatencyMessage =>
  (voiceBotMessage as LatencyMessage).tts_latency !== undefined;

export const isUserMessage = (
  conversationMessage: ConversationMessage,
): conversationMessage is UserMessage => (conversationMessage as UserMessage).user !== undefined;

export const isAssistantMessage = (
  conversationMessage: ConversationMessage,
): conversationMessage is AssistantMessage =>
  (conversationMessage as AssistantMessage).assistant !== undefined;

export type VoiceBotAction = { type: string };

export enum VoiceBotStatus {
  LISTENING = "listening",
  THINKING = "thinking",
  SPEAKING = "speaking",
  SLEEPING = "sleeping",
  NONE = "",
}

export interface VoiceBotState {
  status: VoiceBotStatus;
  sleepTimer: number;
  messages: VoiceBotMessage[];
  attachParamsToCopyUrl: boolean;
  behindTheScenesEvents: BehindTheScenesEvent[];
}

export interface VoiceBotContext extends VoiceBotState {
  addVoicebotMessage: (newMessage: VoiceBotMessage) => void;
  addBehindTheScenesEvent: (data: BehindTheScenesEvent) => void;
  isWaitingForUserVoiceAfterSleep: React.Ref<boolean>;
  startSpeaking: (wakeFromSleep?: boolean) => void;
  startListening: (wakeFromSleep?: boolean) => void;
  startSleeping: () => void;
  toggleSleep: () => void;
  displayOrder: VoiceBotMessage[];
  setAttachParamsToCopyUrl: (attachParamsToCopyUrl: boolean) => void;
}

const initialState: VoiceBotState = {
  status: VoiceBotStatus.SPEAKING,
  sleepTimer: 0,
  messages: [],
  attachParamsToCopyUrl: true,
  behindTheScenesEvents: [],
};

export const VoiceBotContext = createContext<VoiceBotContext | undefined>(undefined);

export function useVoiceBot() {
  const context = useContext(VoiceBotContext);
  if (!context) throw new Error("useVoiceBot must be used within a VoiceBotProvider");
  return context;
}

interface Props {
  children: React.ReactNode;
}

export function VoiceBotProvider({ children }: Props) {
  const [state, dispatch] = useReducer(voiceBotReducer, initialState);
  // Note: After waking from sleep, the bot must wait for the user to speak before playing audio.
  // This prevents unintended audio playback and conversation queue logging if the user rapidly toggles between
  // sleep and wake states in the middle of a bot response.
  const isWaitingForUserVoiceAfterSleep = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: INCREMENT_SLEEP_TIMER });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.sleepTimer > defaultSleepTimeoutSeconds) {
      startSleeping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sleepTimer]);

  const addVoicebotMessage = (newMessage: VoiceBotMessage) => {
    dispatch({ type: ADD_MESSAGE, payload: newMessage });
  };

  const addBehindTheScenesEvent = (event: BehindTheScenesEvent) => {
    dispatch({ type: ADD_BEHIND_SCENES_EVENT, payload: event });
  };

  const startSpeaking = useCallback(
    (wakeFromSleep = false) => {
      if (wakeFromSleep || state.status !== VoiceBotStatus.SLEEPING) {
        dispatch({ type: START_SPEAKING });
      }
    },
    [state.status],
  );

  const startListening = useCallback(
    (wakeFromSleep = false) => {
      if (wakeFromSleep || state.status !== VoiceBotStatus.SLEEPING) {
        dispatch({ type: START_LISTENING });
      }
    },
    [state.status],
  );

  const startSleeping = () => {
    isWaitingForUserVoiceAfterSleep.current = true;
    dispatch({ type: START_SLEEPING });
  };

  const toggleSleep = useCallback(() => {
    if (state.status === VoiceBotStatus.SLEEPING) {
      startListening(true);
    } else {
      startSleeping();
    }
  }, [state.status, startListening]);

  const endOfTurn = (message: ConversationMessage, previousMessage: ConversationMessage) =>
    isAssistantMessage(previousMessage) && isUserMessage(message);

  const displayOrder = useMemo(() => {
    const conv = state.messages.filter(isConversationMessage);
    const lat = state.messages.filter(isLatencyMessage);

    const acc: Array<VoiceBotMessage> = [];

    conv.forEach((conversationMessage, i, arr) => {
      const previousMessage = arr[i - 1];
      if (previousMessage && endOfTurn(conversationMessage, previousMessage)) {
        const latencyMessage = lat.shift();
        if (latencyMessage) acc.push(latencyMessage);
      }
      acc.push(conversationMessage);
      if (isAssistantMessage(conversationMessage) && i === arr.length - 1) {
        const latencyMessage = lat.shift();
        if (latencyMessage) acc.push(latencyMessage);
      }
    });
    return acc;
  }, [state.messages]);

  const setAttachParamsToCopyUrl = useCallback((attachParamsToCopyUrl: boolean) => {
    dispatch({
      type: SET_PARAMS_ON_COPY_URL,
      payload: attachParamsToCopyUrl,
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      isWaitingForUserVoiceAfterSleep,
      displayOrder,
      addVoicebotMessage,
      addBehindTheScenesEvent,
      startSpeaking,
      startListening,
      startSleeping,
      toggleSleep,
      setAttachParamsToCopyUrl,
    }),
    [state, startListening, startSpeaking, toggleSleep, setAttachParamsToCopyUrl, displayOrder],
  );

  return <VoiceBotContext.Provider value={contextValue}>{children}</VoiceBotContext.Provider>;
}
