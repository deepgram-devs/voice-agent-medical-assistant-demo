import { Fragment, useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import Transcript from "./features/voice/Transcript.jsx";
import { useDeepgram } from "../context/DeepgramContextProvider";
import { useMicrophone } from "../context/MicrophoneContextProvider.jsx";
import { EventType, useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { createAudioBuffer, playAudioBuffer } from "../utils/audioUtils";
import { sendSocketMessage, sendMicToSocket } from "../utils/deepgramUtils";
import { isMobile } from "react-device-detect";
import { usePrevious } from "@uidotdev/usehooks";
import { useStsQueryParams } from "../hooks/UseStsQueryParams";
import RateLimited from "./RateLimited.tsx";
import ClinicalNotes from "./features/medical/ClinicalNotes.tsx";
import DrugDispatch from "./features/medical/DrugDispatch.tsx";
import Scheduling from "./features/medical/Scheduling.tsx";

const AnimationManager = lazy(() => import("./layout/AnimationManager.tsx"));

export const App = ({
  defaultStsConfig,
  onMessageEvent = () => { },
  requiresUserActionToInitialize = false,
  className = "",
}) => {
  const {
    status,
    messages,
    addVoicebotMessage,
    addBehindTheScenesEvent,
    isWaitingForUserVoiceAfterSleep,
    toggleSleep,
    startListening,
    startSpeaking,
  } = useVoiceBot();
  const {
    setupMicrophone,
    microphone,
    microphoneState,
    processor,
    microphoneAudioContext,
    startMicrophone,
  } = useMicrophone();
  const { socket, connectToDeepgram, socketState, rateLimited } = useDeepgram();
  const { voice, instructions, applyParamsToConfig } = useStsQueryParams();
  const audioContext = useRef(null);
  const agentVoiceAnalyser = useRef(null);
  const userVoiceAnalyser = useRef(null);
  const startTimeRef = useRef(-1);
  const [data, setData] = useState();
  const [isInitialized, setIsInitialized] = useState(requiresUserActionToInitialize ? false : null);
  const previousVoice = usePrevious(voice);
  const previousInstructions = usePrevious(instructions);
  const scheduledAudioSources = useRef([]);
  const [isRootPath, setIsRootPath] = useState(window.location.pathname === "/");
  const [activeTab, setActiveTab] = useState('clinical-notes');

  // AUDIO MANAGEMENT
  /**
   * Initialize the audio context for managing and playing audio. (just for TTS playback; user audio input logic found in Microphone Context Provider)
   */
  useEffect(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: "interactive",
        sampleRate: 24000,
      });
      agentVoiceAnalyser.current = audioContext.current.createAnalyser();
      agentVoiceAnalyser.current.fftSize = 2048;
      agentVoiceAnalyser.current.smoothingTimeConstant = 0.96;
    }
  }, []);

  /**
   * Callback to handle audio data processing and playback.
   * Converts raw audio into an AudioBuffer and plays the processed audio through the web audio context
   */
  const bufferAudio = useCallback((data) => {
    const audioBuffer = createAudioBuffer(audioContext.current, data);
    if (!audioBuffer) return;
    scheduledAudioSources.current.push(
      playAudioBuffer(audioContext.current, audioBuffer, startTimeRef, agentVoiceAnalyser.current),
    );
  }, []);

  const clearAudioBuffer = () => {
    scheduledAudioSources.current.forEach((source) => source.stop());
    scheduledAudioSources.current = [];
  };

  // MICROPHONE AND SOCKET MANAGEMENT
  useEffect(() => {
    console.log('Initial setup - calling setupMicrophone()');
    // Only setup if not already in progress
    if (microphoneState === null) {
      setupMicrophone();
    }
  }, [microphoneState]);

  useEffect(() => {
    console.log('Microphone state changed:', { microphoneState, hasSocket: !!socket, hasConfig: !!defaultStsConfig });
    if (microphoneState === 1 && socket && defaultStsConfig) {
      const onOpen = () => {
        console.log('Socket opened - starting microphone');
        const combinedStsConfig = applyParamsToConfig(defaultStsConfig);
        sendSocketMessage(socket, combinedStsConfig);
        startMicrophone();
        if (isRootPath) {
          startSpeaking(true);
          isWaitingForUserVoiceAfterSleep.current = false;
        } else {
          startListening(true);
        }
      };

      socket.addEventListener("open", onOpen);
      return () => {
        socket.removeEventListener("open", onOpen);
        microphone.ondataavailable = null;
      };
    }
  }, [microphone, socket, microphoneState, defaultStsConfig, isRootPath]);

  useEffect(() => {
    console.log('Checking processor setup:', {
      hasMicrophone: !!microphone,
      hasSocket: !!socket,
      microphoneState,
      socketState
    });
    if (!microphone) return;
    if (!socket) return;
    if (microphoneState !== 2) return;
    if (socketState !== 1) return;
    console.log('Setting up audio processor');
    processor.onaudioprocess = sendMicToSocket(socket);
  }, [microphone, socket, microphoneState, socketState, processor]);

  /**
   * Create AnalyserNode for user microphone audio context.
   * Exposes audio time / frequency data which is used in the
   * AnimationManager to scale the animations in response to user/agent voice
   */
  useEffect(() => {
    if (microphoneAudioContext) {
      userVoiceAnalyser.current = microphoneAudioContext.createAnalyser();
      userVoiceAnalyser.current.fftSize = 2048;
      userVoiceAnalyser.current.smoothingTimeConstant = 0.96;
      microphone.connect(userVoiceAnalyser.current);
    }
  }, [microphoneAudioContext, microphone]);

  /**
   * Handles incoming WebSocket messages. Differentiates between ArrayBuffer data and other data types (basically just string type).
   * */
  const onMessage = useCallback(
    async (event) => {
      if (event.data instanceof ArrayBuffer) {
        if (status !== VoiceBotStatus.SLEEPING && !isWaitingForUserVoiceAfterSleep.current) {
          bufferAudio(event.data); // Process the ArrayBuffer data to play the audio
        }
      } else {
        console.log(event?.data);
        // Handle other types of messages such as strings
        setData(event.data);
        onMessageEvent(event.data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bufferAudio, status],
  );

  /**
   * Opens Deepgram when the microphone opens.
   * Runs whenever `microphone` changes state, but exits if no microphone state.
   */
  useEffect(() => {
    if (
      microphoneState === 1 &&
      socketState === -1 &&
      (!requiresUserActionToInitialize || (requiresUserActionToInitialize && isInitialized))
    ) {
      connectToDeepgram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    microphone,
    socket,
    microphoneState,
    socketState,
    isInitialized,
    requiresUserActionToInitialize,
  ]);

  /**
   * Sets up a WebSocket message event listener to handle incoming messages through the 'onMessage' callback.
   */
  useEffect(() => {
    if (socket) {
      socket.addEventListener("message", onMessage);
      return () => socket.removeEventListener("message", onMessage);
    }
  }, [socket, onMessage]);

  useEffect(() => {
    if (previousVoice && previousVoice !== voice && socket && socketState === 1) {
      sendSocketMessage(socket, {
        type: "UpdateSpeak",
        model: voice,
      });
    }
  }, [voice, socket, socketState, previousVoice]);

  useEffect(() => {
    if (previousInstructions !== instructions && socket && socketState === 1) {
      sendSocketMessage(socket, {
        type: "UpdateInstructions",
        instructions: `${defaultStsConfig.agent.think.instructions}\n${instructions}`,
      });
    }
  }, [defaultStsConfig, previousInstructions, instructions, socket, socketState]);

  /**
   * Manage responses to incoming data from WebSocket.
   * This useEffect primarily handles string-based data that is expected to represent JSON-encoded messages determining actions based on the nature of the message
   * */
  useEffect(() => {
    /**
     * When the API returns a message event, several possible things can occur.
     *
     * 1. If it's a user message, check if it's a wake word or a stop word and add it to the queue.
     * 2. If it's an agent message, add it to the queue.
     * 3. If the message type is `AgentAudioDone` switch the app state to `START_LISTENING`
     */

    if (typeof data === "string") {
      const userRole = (data) => {
        const userTranscript = data.content;

        /**
         * When the user says something, add it to the conversation queue.
         */
        if (status !== VoiceBotStatus.SLEEPING) {
          addVoicebotMessage({ user: userTranscript });
        }
      };

      /**
       * When the assistant/agent says something, add it to the conversation queue.
       */
      const assistantRole = (data) => {
        if (status !== VoiceBotStatus.SLEEPING && !isWaitingForUserVoiceAfterSleep.current) {
          startSpeaking();
          const assistantTranscript = data.content;
          addVoicebotMessage({ assistant: assistantTranscript });
        }
      };

      try {
        const parsedData = JSON.parse(data);

        /**
         * Nothing was parsed so return an error.
         */
        if (!parsedData) {
          throw new Error("No data returned in JSON.");
        }

        maybeRecordBehindTheScenesEvent(parsedData);

        /**
         * If it's a user message.
         */
        if (parsedData.role === "user") {
          startListening();
          userRole(parsedData);
        }

        /**
         * If it's an agent message.
         */
        if (parsedData.role === "assistant") {
          if (status !== VoiceBotStatus.SLEEPING) {
            startSpeaking();
          }
          assistantRole(parsedData);
        }

        /**
         * The agent has finished speaking so we reset the sleep timer.
         */
        if (parsedData.type === EventType.AGENT_AUDIO_DONE) {
          // Note: It's not quite correct that the agent goes to the listening state upon receiving
          // `AgentAudioDone`. When that message is sent, it just means that all of the agent's
          // audio has arrived at the client, but the client will still be in the process of playing
          // it, which means the agent is still speaking. In practice, with the way the server
          // currently sends audio, this means Talon will deem the agent speech finished right when
          // the agent begins speaking the final sentence of its reply.
          startListening();
        }
        if (parsedData.type === EventType.USER_STARTED_SPEAKING) {
          isWaitingForUserVoiceAfterSleep.current = false;
          startListening();
          clearAudioBuffer();
        }
        if (parsedData.type === EventType.AGENT_STARTED_SPEAKING) {
          const { tts_latency, ttt_latency, total_latency } = parsedData;
          if (!tts_latency || !ttt_latency) return;
          const latencyMessage = { tts_latency, ttt_latency, total_latency };
          addVoicebotMessage(latencyMessage);
        }
      } catch (error) {
        console.error(data, error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, socket]);

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      setIsInitialized(true);
    }

    if (status !== VoiceBotStatus.NONE) {
      toggleSleep();
    }
  };

  const maybeRecordBehindTheScenesEvent = (serverMsg) => {
    switch (serverMsg.type) {
      case EventType.SETTINGS_APPLIED:
        addBehindTheScenesEvent({
          type: EventType.SETTINGS_APPLIED,
        });
        break;
      case EventType.USER_STARTED_SPEAKING:
        if (status === VoiceBotStatus.SPEAKING) {
          addBehindTheScenesEvent({
            type: "Interruption",
          });
        }
        addBehindTheScenesEvent({
          type: EventType.USER_STARTED_SPEAKING,
        });
        break;
      case EventType.AGENT_STARTED_SPEAKING:
        addBehindTheScenesEvent({
          type: EventType.AGENT_STARTED_SPEAKING,
        });
        break;
      case EventType.CONVERSATION_TEXT: {
        const role = serverMsg.role;
        const content = serverMsg.content;
        addBehindTheScenesEvent({
          type: EventType.CONVERSATION_TEXT,
          role: role,
          content: content,
        });
        break;
      }
      case EventType.END_OF_THOUGHT:
        addBehindTheScenesEvent({
          type: EventType.END_OF_THOUGHT,
        });
        break;
    }
  };

  const handleInitialize = async () => {
    if (!isInitialized) {
      setIsInitialized(true);
      await setupMicrophone();
    }
  };

  if (requiresUserActionToInitialize && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button
          onClick={handleInitialize}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Voice Assistant
        </button>
      </div>
    );
  }

  if (rateLimited) {
    return <RateLimited />;
  }

  // MAIN UI
  return (
    <div className={className}>
      <h1 className="text-2xl font-bold text-center py-4">Medical Assistant</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <AnimationManager
          agentVoiceAnalyser={agentVoiceAnalyser.current}
          userVoiceAnalyser={userVoiceAnalyser.current}
          onOrbClick={toggleSleep}
        />
        {!microphone ? (
          <div className="text-base text-gray-400 text-center w-full">Loading microphone...</div>
        ) : (
          <Fragment>
            {socketState === 0 && (
              <div className="text-base text-gray-400 text-center w-full">Loading Deepgram...</div>
            )}
            {socketState > 0 && status === VoiceBotStatus.SLEEPING && (
              <div className="text-xl flex flex-col items-center justify-center">
                <div className="text-gray-400 text-sm">
                  I've stopped listening. {isMobile ? "Tap" : "Click"} the orb to resume.
                </div>
              </div>
            )}

            <div className="w-full max-w-4xl mx-auto mt-8">
              <div className="flex justify-center space-x-4 mb-8">
                <button
                  className={`px-8 py-2 rounded-lg ${activeTab === 'clinical-notes' ? 'bg-blue-500' : 'bg-gray-800'}`}
                  onClick={() => setActiveTab('clinical-notes')}
                >
                  Clinical Notes
                </button>
                <button
                  className={`px-8 py-2 rounded-lg ${activeTab === 'drug-dispatch' ? 'bg-blue-500' : 'bg-gray-800'}`}
                  onClick={() => setActiveTab('drug-dispatch')}
                >
                  Drug Dispatch
                </button>
                <button
                  className={`px-8 py-2 rounded-lg ${activeTab === 'scheduling' ? 'bg-blue-500' : 'bg-gray-800'}`}
                  onClick={() => setActiveTab('scheduling')}
                >
                  Scheduling
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-6">
                {activeTab === 'clinical-notes' && <ClinicalNotes />}
                {activeTab === 'drug-dispatch' && <DrugDispatch />}
                {activeTab === 'scheduling' && <Scheduling />}
              </div>
            </div>

            {/* Transcript Section */}
            <div className="text-sm md:text-base mt-2 flex flex-col items-center text-gray-200 overflow-y-auto">
              {messages.length > 0 ? <Transcript /> : null}
            </div>
          </Fragment>
        )}
      </Suspense>
    </div>
  );
};
