import { useCopyToClipboard } from "@uidotdev/usehooks";
import { XIcon } from "./icons/XIcon";
import { FacebookIcon } from "./icons/FacebookIcon";
import { LinkedInIcon } from "./icons/LinkedInIcon";
import { ShareIcon } from "./icons/ShareIcon";
import { BullhornIcon } from "./icons/BullhornIcon";
import { CheckIcon } from "./icons/CheckIcon";
import { useEffect, useMemo, useState } from "react";
import { useVoiceBot } from "app/context/VoiceBotContextProvider";
import { availableVoices, defaultVoice } from "app/lib/constants";
import { isMobile } from "react-device-detect";
import { useStsQueryParams } from "app/hooks/UseStsQueryParams";

const openShareWindow = (url: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  window?.open(url, "", "_blank, width=600, height=500, resizable=yes, scrollbars=yes");
};

type Props = {
  label?: string;
};

const ShareButtonsPanel = ({ label }: Props) => {
  const { attachParamsToCopyUrl, setAttachParamsToCopyUrl } = useVoiceBot();
  const { voice, instructions } = useStsQueryParams();
  const [showCopySuccess, setShowCopySuccess] = useState<boolean>(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const onCopyLinkClick = () => {
    if (attachParamsToCopyUrl) {
      copyToClipboard(window.location.href);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("voice");
      url.searchParams.delete("instructions");
      const updatedUrl = url.toString();
      copyToClipboard(updatedUrl);
    }
    setShowCopySuccess(true);
  };

  useEffect(() => {
    if (showCopySuccess) {
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 3000);
    }
  }, [showCopySuccess]);

  const selectedVoice = useMemo(() => {
    return availableVoices.find((v) => v.canonical_name === voice);
  }, [voice]);

  const attachParamsToCopyUrlMessage = useMemo(() => {
    if (
      (instructions && selectedVoice?.canonical_name !== defaultVoice.canonical_name) ||
      isMobile
    ) {
      return `Attach edited prompt and current voice (${selectedVoice?.name}) to shared link`;
    } else if (instructions) {
      return `Attach edited prompt to shared link`;
    } else if (selectedVoice?.canonical_name !== defaultVoice.canonical_name) {
      return `Attach current voice (${selectedVoice?.name}) to shared link`;
    }

    return null;
  }, [instructions, selectedVoice]);

  const toggleAttachParamsToCopyUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachParamsToCopyUrl(e.currentTarget.checked);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-25">
        <BullhornIcon />
        <span className="uppercase font-favorit">Share</span>
      </div>
      {attachParamsToCopyUrlMessage && (
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            className="hidden"
            checked={attachParamsToCopyUrl}
            aria-label={attachParamsToCopyUrlMessage}
            onChange={toggleAttachParamsToCopyUrl}
          />
          <div
            aria-hidden="true"
            className={`w-5 h-5 flex-shrink-0 text-gray-850 flex justify-center items-center rounded-sm ${attachParamsToCopyUrl ? "bg-green-spring" : "bg-white"}`}
          >
            {attachParamsToCopyUrl && <CheckIcon />}
          </div>
          <span className="text-sm text-gray-200 ml-2">{attachParamsToCopyUrlMessage}</span>
        </label>
      )}
      <div className="flex items-center gap-x-4">
        {label && <span className="text-gray-450">{label}</span>}
        <div className="h-full flex items-center gap-8 md:gap-4 font-inter text-gray-350 text-2xl">
          <div className="relative">
            <button className="link flex items-center" onClick={onCopyLinkClick}>
              <ShareIcon className="md:hover:text-blue-link" />
            </button>
            {showCopySuccess && (
              <span className="text-gray-25 p-2 mb-2 bg-gray-700 absolute bottom-full text-sm rounded-sm border-gray-600 border-solid border">
                Copied!
              </span>
            )}
          </div>
          <a
            href="#"
            className="flex items-center"
            onClick={openShareWindow(
              `https://twitter.com/intent/tweet?text=${encodeURI(window.location.href)}`,
            )}
            aria-label="share on twitter"
          >
            <XIcon className="md:hover:text-blue-link" />
          </a>
          <a
            href="#"
            className="flex items-center"
            onClick={openShareWindow(
              `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURI(window.location.href)}`,
            )}
            aria-label="share on Linkedin"
          >
            <LinkedInIcon className="md:hover:text-blue-link" />
          </a>
          <a
            href="#"
            className="flex items-center"
            onClick={openShareWindow(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(window.location.href)}`,
            )}
            aria-label="share on Facebook"
          >
            <FacebookIcon className="md:hover:text-blue-link" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShareButtonsPanel;
