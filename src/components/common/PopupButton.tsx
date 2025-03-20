import { useState, type ReactNode, type FC } from "react";
import PopupBody from "../features/voice/PopupBody.jsx";
import { XMarkIcon } from "./icons/XMarkIcon.jsx";

type Props = {
  buttonIcon: ReactNode;
  buttonText: ReactNode;
  popupContent: ReactNode;
  tooltipText?: string | null;
};

const PopupButton: FC<Props> = ({ buttonIcon, buttonText, popupContent, tooltipText }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative max-w-max text-gray-350">
      <button
        className={`flex peer items-center gap-2 hover:text-gray-25 ${isOpen ? "pointer-events-none" : ""}`}
        onClick={() => setIsOpen(true)}
      >
        {buttonIcon}
        {buttonText}
      </button>
      {tooltipText && (
        <div className="absolute w-max z-10 top-7 left-8 p-4 text-base text-gray-25 hidden peer-hover:flex bg-gray-850 border border-solid border-gray-800 rounded-sm">
          {tooltipText}
        </div>
      )}
      {isOpen && (
        <PopupBody onExit={() => setIsOpen(false)}>
          <div className="absolute w-max bottom-0 left-full ml-4 p-6 border border-gray-700 rounded-lg bg-gray-850">
            <button
              aria-label="Close"
              className="absolute top-6 right-6 leading-none text-xl flex hover:text-gray-25"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon />
            </button>
            {popupContent}
          </div>
        </PopupBody>
      )}
    </div>
  );
};

export default PopupButton;
