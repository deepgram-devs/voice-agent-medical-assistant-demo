import React, { useRef, useLayoutEffect, type FC } from "react";
import {
  isConversationMessage,
  isUserMessage,
  useVoiceBot,
  type ConversationMessage,
} from "../context/VoiceBotContextProvider";
import { UserIcon } from "./icons/UserIcon";
import { AssistantIcon } from "./icons/AssistantIcon";
import { XMarkIcon } from "./icons/XMarkIcon";

const ConversationMessageDisplay: FC<{
  message: ConversationMessage;
  firstInSequence: boolean;
}> = ({ message, firstInSequence }) => (
  <div
    className={`flex flex-col ${
      isUserMessage(message) ? "ml-8 md:ml-16 items-end" : "mr-8 md:mr-16 items-start"
    } ${isUserMessage(message) && firstInSequence ? "mt-4" : "mt-2"}
    ${isUserMessage(message) && message.user === "" ? "italic" : ""}`}
  >
    <div
      className={`flex justify-center items-center gap-2 ${isUserMessage(message) ? "flex-row-reverse" : ""}`}
    >
      <span
        className={`flex-shrink-0 ${firstInSequence ? "" : "opacity-0"}`}
        aria-hidden={!firstInSequence}
      >
        {isUserMessage(message) ? <UserIcon /> : <AssistantIcon />}
      </span>
      <p
        className={`text-gray-200 border py-3 px-6 rounded-2xl ${
          isUserMessage(message) ? "bg-gray-800 border-gray-700 " : "bg-gray-1000  border-gray-800"
        }`}
      >
        {isUserMessage(message)
          ? message.user || "<non-word utterance detected>"
          : message.assistant}
      </p>
    </div>
  </div>
);

const isFirstMessageInSpeakerSequence = (
  message: ConversationMessage,
  allMessages: ConversationMessage[],
) => {
  const previousMessage = allMessages[allMessages.indexOf(message) - 1];
  if (!previousMessage) return true;
  return isUserMessage(message) !== isUserMessage(previousMessage);
};

interface Props {
  toggleConversation: () => void;
}

function Conversation({ toggleConversation }: Props) {
  const { displayOrder } = useVoiceBot();
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayOrder]);

  return (
    <div
      className="absolute top-[250px] bottom-[0] left-0 md:left-[20%] w-[100%] md:w-[60%] pt-4 z-10 border border-gray-800 rounded-[1px]"
      style={{
        background: "linear-gradient(0deg, #16161A 47.8%, #25252B 99.86%)",
      }}
    >
      <div className="h-full flex flex-col justify-between">
        <button
          aria-label="Close"
          className="absolute top-0 right-0 mx-4 px-4 py-4 text-gray-350"
          onClick={toggleConversation}
        >
          <XMarkIcon />
        </button>
        <div className="flex justify-center py-4 mx-8 text-[14px] text-gray-450">
          Conversation transcript:
        </div>

        <div ref={scrollRef} className="scrollbar flex flex-col items-center pb-4 overflow-auto">
          <div className="px-4 max-w-xl">
            {displayOrder.filter(isConversationMessage).map((message, index, filteredMessages) => (
              <ConversationMessageDisplay
                message={message}
                firstInSequence={isFirstMessageInSpeakerSequence(message, filteredMessages)}
                key={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conversation;
