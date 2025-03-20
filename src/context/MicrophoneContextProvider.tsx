import { type ReactNode, createContext, useCallback, useContext, useState } from "react";

interface MicrophoneContextType {
  microphone: MediaStreamAudioSourceNode | undefined;
  startMicrophone: () => void;
  setupMicrophone: () => Promise<void>;
  microphoneState: number | null;
  microphoneAudioContext: AudioContext | undefined;
  setMicrophoneAudioContext: (context: AudioContext) => void;
  processor: ScriptProcessorNode | undefined;
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(undefined);

const MicrophoneContextProvider = ({ children }: { children: ReactNode }) => {
  const [microphoneState, setMicrophoneState] = useState<number | null>(null);
  const [microphone, setMicrophone] = useState<MediaStreamAudioSourceNode>();
  const [microphoneAudioContext, setMicrophoneAudioContext] = useState<AudioContext>();
  const [processor, setProcessor] = useState<ScriptProcessorNode>();

  const setupMicrophone = async () => {
    console.log('Setting up microphone...');
    setMicrophoneState(0);

    try {
      // First check if we have permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Microphone permission status:', permissionStatus.state);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
        },
      });

      console.log('Got microphone stream');
      const microphoneAudioContext = new AudioContext();
      await microphoneAudioContext.resume(); // Ensure audio context is running
      const microphone = microphoneAudioContext.createMediaStreamSource(stream);
      const processor = microphoneAudioContext.createScriptProcessor(4096, 1, 1);

      setMicrophone(microphone);
      setMicrophoneAudioContext(microphoneAudioContext);
      setProcessor(processor);
      setMicrophoneState(1);
      console.log('Microphone setup complete - state:', 1);
    } catch (err) {
      console.error('Microphone setup error:', err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          alert("Please allow microphone access to use the voice features");
        } else if (err.name === "NotFoundError") {
          alert("No microphone found. Please connect a microphone and try again.");
        } else {
          console.error('Unknown microphone error:', err);
        }
      }
      setMicrophoneState(null);
    }
  };

  const startMicrophone = useCallback(() => {
    if (!microphone || !processor || !microphoneAudioContext) return;
    microphone.connect(processor);
    processor.connect(microphoneAudioContext.destination);
    setMicrophoneState(2);
  }, [processor, microphoneAudioContext, microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        setupMicrophone,
        microphoneState,
        microphoneAudioContext,
        setMicrophoneAudioContext,
        processor
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);
  if (context === undefined) {
    throw new Error('useMicrophone must be used within a MicrophoneContextProvider');
  }
  return context;
}

export { MicrophoneContextProvider, useMicrophone };
