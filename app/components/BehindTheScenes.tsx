import React, { useRef, useLayoutEffect } from "react";
import { XMarkIcon } from "./icons/XMarkIcon";
import { DownArrowIcon } from "./icons/DownArrowIcon.js";
import { UpArrowIcon } from "./icons/UpArrowIcon.js";
import { AudioIcon } from "./icons/AudioIcon";
import { BrainIcon } from "./icons/BrainIcon";
import {
  EventType,
  useVoiceBot,
  type BehindTheScenesEvent,
} from "../context/VoiceBotContextProvider";

interface BehindTheScenesProps {
  onClose: () => void;
}

function BehindTheScenes({ onClose }: BehindTheScenesProps) {
  const { behindTheScenesEvents } = useVoiceBot();
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [behindTheScenesEvents]);

  return (
    <div
      className="border border-gray-800 rounded-[1px]"
      style={{
        background: "linear-gradient(0deg, #16161A 47.8%, #25252B 99.86%)",
        minWidth: "500px",
        maxWidth: "500px",
      }}
    >
      <div className="h-full flex flex-col">
        <button
          aria-label="Close"
          className="absolute top-4 right-4 mx-4 px-4 py-4 text-gray-350"
          onClick={onClose}
        >
          <XMarkIcon />
        </button>
        <div className="flex justify-center py-4 mx-8 text-[14px] text-gray-450">Backstage:</div>

        <div
          ref={scrollRef}
          className="scrollbar flex-1 flex flex-col items-left pb-4 overflow-auto"
          style={{ minHeight: "600px", maxHeight: "600px", width: "100%" }}
        >
          <div className="px-4 max-w-xl flex flex-col gap-12">
            <div key={-1} className="text-gray-200 flex items-center gap-3">
              <span>🟢&nbsp;&nbsp;Connection started</span>
            </div>
            {behindTheScenesEvents.map((event, index) => (
              <div key={index} className="text-gray-200 flex items-center gap-3">
                {display_event(event)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const display_event = (event: BehindTheScenesEvent) => {
  switch (event.type) {
    case EventType.SETTINGS_APPLIED:
      return (
        <>
          <UpArrowIcon className="text-[#13EF93]" />
          {"Settings configured"}
        </>
      );
    case EventType.USER_STARTED_SPEAKING:
      return (
        <>
          <DownArrowIcon className="text-[#A1D7FD]" />
          {"User started speaking"}
        </>
      );
    case EventType.AGENT_STARTED_SPEAKING:
      return (
        <>
          <DownArrowIcon className="text-[#A1D7FD]" />
          {"Agent started speaking"}
        </>
      );
    case EventType.CONVERSATION_TEXT: {
      const speaker = event.role === "assistant" ? "Agent" : "User";
      const statement = event.content;
      return (
        <>
          <DownArrowIcon className="text-[#A1D7FD]" />
          {`${speaker} text "${statement}"`}
        </>
      );
    }
    case "Interruption":
      return (
        <>
          <AudioIcon className="text-[#F04438]" />
          <span className="text-[#F04438]">Agent interrupted</span>
        </>
      );
    case EventType.END_OF_THOUGHT:
      return (
        <>
          <BrainIcon className="text-[#FEDF89]" />
          <span className="text-[#FEDF89]">End of thought detected</span>
        </>
      );
  }
};

export default BehindTheScenes;
