"use client";

import { createContext, useCallback, useContext, useState } from "react";

const MicrophoneContext = createContext();

const MicrophoneContextProvider = ({ children }) => {
  /**
   * Possible microphone states:
   * - not setup - null
   * - setting up - 0
   * - ready - 1
   * - open - 2
   * - paused - 3
   */
  const [microphoneState, setMicrophoneState] = useState(null);
  const [microphone, setMicrophone] = useState();
  const [microphoneAudioContext, setMicrophoneAudioContext] = useState();
  const [processor, setProcessor] = useState();

  const setupMicrophone = async () => {
    setMicrophoneState(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          volume: 1.0,
          echoCancellation: true,
          noiseSuppression: false,
          latency: 0,
        },
      });

      const microphoneAudioContext = new AudioContext();
      const microphone = microphoneAudioContext.createMediaStreamSource(stream);
      const processor = microphoneAudioContext.createScriptProcessor(4096, 1, 1);

      setMicrophone(microphone);
      setMicrophoneAudioContext(microphoneAudioContext);
      setProcessor(processor);
      setMicrophoneState(1);
    } catch (err) {
      console.error(err);
      if (err.name !== "NotFoundError" && err.name !== "NotAllowedError") {
        console.log(err.name);
      }
    }
  };

  const startMicrophone = useCallback(() => {
    microphone.connect(processor);
    processor.connect(microphoneAudioContext.destination);
    setMicrophoneState(2);
  }, [processor, microphoneAudioContext, microphone]);

  // const stopMicrophone = useCallback(() => {
  //   if (microphone?.state === "recording") {
  //     microphone?.pause();
  //     setMicrophoneState(3); // paused test
  //   }
  // }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        // stopMicrophone,
        setupMicrophone,
        microphoneState,
        microphoneAudioContext,
        setMicrophoneAudioContext,
        processor,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone() {
  return useContext(MicrophoneContext);
}

export { MicrophoneContextProvider, useMicrophone };
