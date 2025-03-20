import type { FC, ComponentPropsWithoutRef, KeyboardEventHandler } from "react";
import { useClickAway } from "@uidotdev/usehooks";

interface Props extends ComponentPropsWithoutRef<"div"> {
  onExit: () => void;
}

const PopupBody: FC<Props> = ({ onExit, ...props }) => {
  const ref = useClickAway<HTMLDivElement>(onExit);

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Escape") onExit();
  };

  return <div ref={ref} onKeyDown={handleKeyDown} {...props} />;
};

export default PopupBody;
