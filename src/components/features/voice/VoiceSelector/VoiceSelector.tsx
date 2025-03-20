import { availableVoices } from "app/lib/constants";
import type { Voice } from "../../utils/deepgramUtils";
import Image from "next/image";
import { useEffect, useState, type FC, type MouseEventHandler } from "react";
import styles from "./VoiceSelector.module.scss";
import { useStsQueryParams } from "app/hooks/UseStsQueryParams";

const ANIMATION_DURATION = 200;

interface Props {
  className?: string;
  showLabel?: boolean;
  collapsible?: boolean;
}

const VoiceSelector: FC<Props> = ({ className = "", showLabel, collapsible }) => {
  const { voice, updateVoiceUrlParam } = useStsQueryParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sortedVoices, setSortedVoices] = useState<Voice[]>(availableVoices);

  const handleVoiceIconClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (collapsible && !isOpen) {
      setIsOpen(true);
    } else {
      if (collapsible) {
        setIsOpen(false);
      }
    }
    updateVoiceUrlParam(e.currentTarget.value);
  };

  useEffect(() => {
    if (!isOpen && collapsible && voice !== sortedVoices[0]?.canonical_name) {
      const selectedVoiceIndex = availableVoices.findIndex((v) => v.canonical_name === voice);
      const selectedVoice = availableVoices[selectedVoiceIndex];
      const sorted = [...availableVoices];
      if (selectedVoiceIndex >= 0 && selectedVoice) {
        sorted.splice(selectedVoiceIndex, 1);
        sorted.unshift(selectedVoice);
      }

      // Rearrange the voices AFTER the transition duration is over to prevent jumpiness
      setTimeout(() => {
        setSortedVoices(sorted);
      }, ANIMATION_DURATION);
    }
  }, [voice, collapsible, isOpen, sortedVoices]);

  const isSelected = (v: Voice) => voice === v.canonical_name;

  const voicesListClassName = [
    styles["voice-list"],
    !collapsible && styles["voice-list--default"],
    collapsible && isOpen && styles["voice-list--collapsibleOpen"],
    collapsible && !isOpen && styles["voice-list--collapsibleClosed"],
  ]
    .flat()
    .filter(Boolean)
    .join(" ");

  const voiceListItemClassName = (voice: Voice) =>
    [
      styles["voice-list__item"],
      isSelected(voice)
        ? styles["voice-list__item--selected"]
        : styles["voice-list__item--unselected"],
    ]
      .flat()
      .join(" ");

  const collapsedBackgroundClassName = collapsible
    ? `bg-gradient-to-t ${isOpen ? "from-black w-full" : "from-transparent"} from-80% to-transparent`
    : "";

  return (
    <div className={`${className} ${collapsedBackgroundClassName}`}>
      {showLabel && <div className="text-gray-450 text-sm mr-2">Voices:</div>}
      <ul className={voicesListClassName}>
        {sortedVoices.map((voice, i) => (
          <li
            className={voiceListItemClassName(voice)}
            key={voice.name}
            style={
              collapsible && isOpen
                ? {
                    paddingLeft: i * 40,
                  }
                : {}
            }
          >
            <button
              className={styles["voice-list__icon"]}
              onClick={handleVoiceIconClick}
              value={voice.canonical_name}
              style={
                // Border is hidden for unselected hidden voices to prevent the border height from impacting the close/open transitions
                !collapsible || isOpen || isSelected(voice)
                  ? {
                      border: `2px solid ${voice.metadata.color}`,
                    }
                  : {}
              }
            >
              <Image
                src={voice.metadata.image}
                alt={voice.name}
                width={80}
                height={80}
                className="rounded-full object-scale-down"
                priority
              />
            </button>

            <div className={styles["voice-list__info"]}>
              <span className="capitalize font-semibold md:font-normal text-gray-200 md:text-gray-25">
                {voice.name}
                <span className="hidden md:inline">.</span>{" "}
              </span>
              <span className="whitespace-nowrap text-gray-450 md:text-gray-25">
                <span className="capitalize">{voice.metadata.accent}</span>{" "}
                <span className="lowercase">{voice.metadata.gender}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VoiceSelector;
