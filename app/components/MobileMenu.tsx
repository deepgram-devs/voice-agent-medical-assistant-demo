import { type FC, useState, useEffect, useRef } from "react";
import PopupBody from "app/components/PopupBody";
import InstructionInput from "app/components/InstructionInput";
import { XMarkIcon } from "app/components/icons/XMarkIcon";
import { BarsIcon } from "app/components/icons/BarsIcon";
import ShareButtonsPanel from "./ShareButtonsPanel";
import { useStsQueryParams } from "app/hooks/UseStsQueryParams";

interface Props {
  hideInstructionInput?: boolean;
  className?: string;
}

enum Expansion {
  // For leaving the tray contents unmounted
  Closed = "Closed",
  // A "one-frame" state to render the tray while the component is offscreen
  Opening = "Opening",
  // The regular open state (including the initial transition)
  Open = "Open",
  // An ephemeral state to represent the time spent transitioning down before unmounting
  Closing = "Closing",
}
const { Closed, Opening, Open, Closing } = Expansion;

const MobileMenu: FC<Props> = ({ hideInstructionInput, className }) => {
  const { instructions } = useStsQueryParams();
  const [expansion, setExpansion] = useState<Expansion>(Closed);
  const closeButton = useRef<HTMLButtonElement>(null);

  const position = expansion === Open ? "translate-y-0" : "translate-y-full";

  useEffect(() => {
    if (expansion === Opening) {
      closeButton.current?.focus();
      setExpansion(Open);
    }
  }, [expansion]);

  const handleTransitionEnd = () => {
    if (expansion === Closing) setExpansion(Closed);
  };

  return (
    <div className={className}>
      <button
        className="p-3 border border-gray-700 rounded-lg text-2xl leading-none relative"
        onClick={() => setExpansion(Opening)}
      >
        <BarsIcon />
        {instructions && (
          <span className="absolute right-2 top-1 text-sm text-green-spring">*</span>
        )}
      </button>
      {expansion !== Closed && (
        <PopupBody onExit={() => setExpansion(Closing)}>
          <div
            onTransitionEnd={handleTransitionEnd}
            className={`fixed bottom-0 left-0 w-full p-6 pb-14 border-t border-gray-700 bg-gray-850 transition-transform ${position}`}
          >
            <div className="flex justify-end">
              <button
                ref={closeButton}
                aria-label="Close"
                className="text-xl flex text-gray-350"
                onClick={() => setExpansion(Closing)}
              >
                <XMarkIcon />
              </button>
            </div>
            <div className="flex flex-col space-y-10">
              {!hideInstructionInput && <InstructionInput focusOnMount={false} />}
              <ShareButtonsPanel />
            </div>
          </div>
        </PopupBody>
      )}
    </div>
  );
};

export default MobileMenu;
