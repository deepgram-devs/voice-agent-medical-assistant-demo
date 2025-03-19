"use client";
import { useState, Suspense } from "react";
import { App } from "./components/App";
import Intelligence from "./components/Intelligence";
import { stsConfig } from "./lib/constants";
import {
  isConversationMessage,
  useVoiceBot,
} from "./context/VoiceBotContextProvider";
import { CaretIcon } from "./components/icons/CaretIcon";
import { PencilIcon } from "./components/icons/PencilIcon";
import InstructionInput from "./components/InstructionInput";
import { TerminalIcon } from "./components/icons/TerminalIcon";
import { BullhornIcon } from "./components/icons/BullhornIcon";
import ShareButtonsPanel from "./components/ShareButtonsPanel";
import * as WaitlistLink from "./components/WaitlistLink";
import { useStsQueryParams } from "./hooks/UseStsQueryParams";
import BehindTheScenes from "./components/BehindTheScenes";
import { VoiceBotProvider } from './context/VoiceBotContextProvider';
import { DeepgramContextProvider } from './context/DeepgramContextProvider';
import MedicalTranscription from './components/medical/MedicalTranscription';
import Conversation from "./components/Conversation";
import VoiceSelector from "./components/VoiceSelector/VoiceSelector";
import { isMobile } from "react-device-detect";
import PopupButton from "./components/PopupButton";
import MobileMenu from "./components/MobileMenu";

const DesktopMenuItems = () => {
  const { instructions } = useStsQueryParams();
  return (
    <>
      <PopupButton
        buttonIcon={<PencilIcon />}
        buttonText={
          <span>Prompt {instructions && <span className="text-green-spring">*</span>}</span>
        }
        popupContent={<InstructionInput className="w-96" focusOnMount />}
        tooltipText={instructions ? "Using your custom prompt. Click to edit." : null}
      />
      <PopupButton
        buttonIcon={<BullhornIcon />}
        buttonText="Share"
        popupContent={<ShareButtonsPanel label="Share:" />}
      />
      <WaitlistLink.Plaintext />
    </>
  );
};

export default function Home() {
  const { messages } = useVoiceBot();
  const [conversationOpen, setConversationOpen] = useState(false);
  const [behindTheScenesOpen, setBehindTheScenesOpen] = useState(false);

  const toggleConversation = () => setConversationOpen(!conversationOpen);

  const has4ConversationMessages = messages.filter(isConversationMessage).length > 3;

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-8 relative">
        {/* Left panel */}
        <div className="hidden fixed left-8 top-8 flex flex-col items-start space-y-4">
          <Intelligence />
          {!isMobile && (
            <Suspense fallback={<div>Loading...</div>}>
              <DesktopMenuItems />
            </Suspense>
          )}
        </div>

        {/* Center panel */}
        <div className="mx-auto max-w-3xl relative">
          <div className="">
            <h1 className="text-2xl font-bold text-center text-gray-200">Medical Assistant</h1>
          </div>
          <DeepgramContextProvider>
            <VoiceBotProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <App
                  defaultStsConfig={stsConfig}
                  className="flex-shrink-0 h-[130px] opacity-75 disabled:opacity-50"
                  requiresUserActionToInitialize={isMobile}
                />
                <MedicalTranscription />
              </Suspense>
            </VoiceBotProvider>
          </DeepgramContextProvider>
        </div>

        {/* Right panel */}
        <div className="fixed right-8 top-8 flex flex-col items-end space-y-4">
          <Suspense fallback={<div>Loading...</div>}>
            <VoiceSelector />
            {isMobile && <MobileMenu />}
          </Suspense>
          <button
            onClick={toggleConversation}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              conversationOpen
                ? "bg-gray-800 text-gray-200"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>Conversation</span>
            <CaretIcon
              className={`transform transition-transform ${
                conversationOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {has4ConversationMessages && (
            <button
              onClick={() => setBehindTheScenesOpen(!behindTheScenesOpen)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                behindTheScenesOpen
                  ? "bg-gray-800 text-gray-200"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <TerminalIcon />
              <span>Behind the scenes</span>
            </button>
          )}
        </div>

        {/* Overlays */}
        {conversationOpen && (
          <Suspense fallback={<div>Loading...</div>}>
            <Conversation toggleConversation={toggleConversation} />
          </Suspense>
        )}
        {behindTheScenesOpen && (
          <Suspense fallback={<div>Loading...</div>}>
            <BehindTheScenes onClose={() => setBehindTheScenesOpen(false)} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
