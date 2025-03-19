import { type FC, Suspense, useEffect, useState } from "react";
import LogoLink from "app/components/LogoLink";
import VoiceSelector from "app/components/VoiceSelector/VoiceSelector";
import * as WaitlistLink from "app/components/WaitlistLink";

interface Props {
  logoHref: string;
  title?: string;
}

const Header: FC<Props> = ({ logoHref, title = "Talk to AI" }) => {
  const [isAgentPage, setIsAgentPage] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAgentPage(window.location.pathname === "/agent");
    }
  }, []);

  return (
    <>
      <header className="flex md:hidden m-4 items-center justify-between">
        <LogoLink href={logoHref} />
        <WaitlistLink.Button />
      </header>
      {isAgentPage && (
        <p className="text-left text-gray-450 md:hidden mx-4">
          Call{" "}
          <a href="tel:+17343718307" className="text-gray-450 hover:text-gray-600">
            +1&nbsp;734&nbsp;371&nbsp;8307
          </a>
        </p>
      )}
      <header className="hidden md:flex mx-10 my-8 items-center justify-between">
        <div className="flex-1">
          <LogoLink href={logoHref} />
        </div>
        <div className="flex-1 md:block hidden text-center">
          <h2 className="h-10 leading-10 font-favorit align-middle text-gray-25">{title}</h2>
          {isAgentPage && (
            <p className="text-gray-450">
              Call{" "}
              <a href="tel:+17343718307" className="text-gray-450 hover:text-gray-600">
                +1&nbsp;734&nbsp;371&nbsp;8307
              </a>
            </p>
          )}
        </div>
        <div className="flex-1">
          <Suspense>
            <VoiceSelector className="flex justify-end items-center" showLabel />
          </Suspense>
        </div>
      </header>
    </>
  );
};

export default Header;
