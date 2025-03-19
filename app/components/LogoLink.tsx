import type { FC } from "react";
import Image from "next/image";
import { withBasePath } from "../utils/deepgramUtils";

interface Props {
  href: string;
}

const LogoLink: FC<Props> = ({ href }) => (
  <a className="flex items-center" href={href}>
    <Image
      className="w-auto h-6 max-w-[12.5rem] sm:max-w-none"
      src={withBasePath("/deepgram.svg")}
      alt="Deepgram Logo"
      width={0}
      height={0}
      priority
    />
  </a>
);

export default LogoLink;
