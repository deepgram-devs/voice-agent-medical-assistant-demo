import type { FC, ComponentProps } from "react";
import { NewTabIcon } from "./icons/NewTabIcon";

const Link: FC<ComponentProps<"a">> = ({ children, ...props }) => (
  <a target="_blank" href="https://deepgram.typeform.com/to/MIE8qbmF" {...props}>
    <span>Join Waitlist</span>
    {children}
  </a>
);

export const Plaintext: FC = () => (
  <Link className="flex max-w-max gap-2 items-center text-blue-link font-semibold">
    <NewTabIcon />
  </Link>
);

export const Button: FC = () => (
  <Link className="block px-3 py-2 font-semibold rounded border text-gray-25 border-gray-25" />
);
