import {
  type FC,
  type ReactNode,
  type ComponentProps,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useDeepgram } from "../context/DeepgramContextProvider";
import styles from "./Intelligence.module.css";

const enum BargeInState {
  Start,
  AgentSpeaking,
  UserSpeaking,
  AgentStopped,
}

const progressBargeInState =
  (newState: BargeInState) =>
  (lastState: BargeInState): BargeInState => {
    if (newState === BargeInState.AgentSpeaking) return BargeInState.AgentSpeaking;
    if (newState === BargeInState.UserSpeaking) {
      return lastState === BargeInState.AgentSpeaking
        ? BargeInState.UserSpeaking
        : BargeInState.Start;
    }
    if (newState === BargeInState.AgentStopped) {
      return lastState === BargeInState.UserSpeaking
        ? BargeInState.AgentStopped
        : BargeInState.Start;
    }

    return BargeInState.Start;
  };

interface BarProps {
  color: string;
  onFadeOut: () => void;
  children: ReactNode;
}

interface ShineBarProps extends ComponentProps<"svg"> {
  color: string;
}

const increment = ((n: number) => (): number => {
  n += 1;
  return n;
})(0);

const ShineBar: FC<ShineBarProps> = ({ color, ...props }) => {
  const idUniquePart = increment();

  return (
    <svg
      width="53"
      height="29"
      viewBox="0 0 233 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g style={{ mixBlendMode: "overlay" }} filter={`url(#filter0_f_1453_6023${idUniquePart})`}>
        <path
          d="M218.5 8.00001C222.09 8.00001 225 10.9102 225 14.5C225 18.0899 222.09 21 218.5 21L14.5 21C10.9101 21 8 18.0898 8 14.5C8 10.9101 10.9101 8 14.5 8L218.5 8.00001Z"
          fill={`url(#paint0_radial_1453_6023${idUniquePart})`}
        />
      </g>
      <defs>
        <filter
          id={`filter0_f_1453_6023${idUniquePart}`}
          x="0"
          y="0"
          width="233"
          height="29"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="4" result="effect1_foregroundBlur_1453_6023" />
        </filter>
        <radialGradient
          id={`paint0_radial_1453_6023${idUniquePart}`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(112.5 11) rotate(90.9878) scale(58.0086 354.037)"
        >
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

const Shine: FC<ComponentProps<"svg">> = (props) => {
  const idUniquePart = increment();

  return (
    <svg
      width="53"
      height="31"
      viewBox="0 0 53 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        style={{ mixBlendMode: "color-dodge" }}
        filter={`url(#filter0_f_1453_6024${idUniquePart})`}
      >
        <ellipse
          cx="26.5"
          cy="15.5"
          rx="21.5"
          ry="10.5"
          fill={`url(#paint0_radial_1453_6024${idUniquePart})`}
        />
      </g>
      <defs>
        <filter
          id={`filter0_f_1453_6024${idUniquePart}`}
          x="0.417458"
          y="0.417458"
          width="52.1651"
          height="30.1651"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="2.29127" result="effect1_foregroundBlur_1453_6024" />
        </filter>
        <radialGradient
          id={`paint0_radial_1453_6024${idUniquePart}`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(26.5 15.5) rotate(97.125) scale(24.1868 49.5253)"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="#1D1D1D" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

const baseBarStyles: string = "w-96 flex flex-col gap-2 items-center overflow-hidden pb-3";

const Bar: FC<BarProps> = ({ color, onFadeOut, children }) => {
  const [fade, setFade] = useState<boolean>(false);

  const fadeOut = fade ? styles.fadeOut : "";

  return (
    <div
      className={`${baseBarStyles} ${fadeOut}`}
      onAnimationEnd={(event) => {
        if (event.animationName === styles.fade) {
          onFadeOut();
        }
      }}
    >
      <div style={{ color }} className="font-fira text-xs">
        {children}
      </div>
      <div style={{ backgroundColor: color }} className="relative h-px w-full">
        <ShineBar
          color={color}
          onAnimationEnd={() => {
            setFade(true);
          }}
          className={`absolute top-0 transform -translate-y-1/2 h-2.5 blur-sm ${styles.scan}`}
        />
        <Shine
          className={`absolute top-0 transform -translate-y-1/2 mix-blend-color-dodge ${styles.scan}`}
        />
      </div>
    </div>
  );
};

const PlaceholderBar: FC = () => (
  <div aria-hidden="true" id="joe" className={`${baseBarStyles} opacity-0`}>
    <div className="font-fira text-xs whitespace-pre"> </div>
    <div className="relative h-px w-full" />
  </div>
);

const Intelligence: FC = () => {
  const { socket } = useDeepgram();
  const [bargeIn, setBargeIn] = useState(BargeInState.Start);
  const [hasBargedIn, setHasBargedIn] = useState(false);

  const onMessage = useCallback(
    (event: MessageEvent): void => {
      if (typeof event.data === "string") {
        // At this point, we expect this to be some kind of JSON
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case "AgentAudioDone":
              setBargeIn(progressBargeInState(BargeInState.AgentStopped));
              break;
            case "UserStartedSpeaking":
              setBargeIn(progressBargeInState(BargeInState.UserSpeaking));
              break;
            case "ConversationText":
              if (message.role === "assistant") {
                setBargeIn(progressBargeInState(BargeInState.AgentSpeaking));
              }
              break;
            default:
              break;
          }
        } catch (e) {
          console.error("Failed to parse JSON from socket message event.");
        }
      }
    },
    [setBargeIn],
  );

  useEffect((): void => {
    if (bargeIn === BargeInState.AgentStopped) {
      setHasBargedIn(true);
    }
  }, [bargeIn]);

  useEffect((): (() => void) | void => {
    if (socket) {
      socket.addEventListener("message", onMessage);
      return () => socket.removeEventListener("message", onMessage);
    }
  }, [socket, onMessage]);

  if (hasBargedIn) {
    return (
      <Bar onFadeOut={() => setHasBargedIn(false)} color="#fdb022">
        Interruption Detected
      </Bar>
    );
  }

  return <PlaceholderBar />;
};

export default Intelligence;
