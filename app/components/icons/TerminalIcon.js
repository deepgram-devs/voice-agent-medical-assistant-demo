export const TerminalIcon = ({ className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 21 20"
      fill="none"
      className={`inline-block w-[1em] h-[1em] ${className}`}
    >
      <path
        fill="#BBBBBF"
        d="M1.009 1.617c-.391.488-.391 1.278 0 1.766L6.299 10l-5.29 6.617c-.391.488-.391 1.281 0 1.77.39.488 1.025.488 1.415 0l6-7.5c.39-.489.39-1.282 0-1.77l-6-7.5c-.39-.488-1.025-.488-1.415 0"
      ></path>
      <path
        fill="#BBBBBF"
        d="M7.715 17.5c0-.691.447-1.25 1-1.25h9c.553 0 1 .559 1 1.25s-.447 1.25-1 1.25h-9c-.553 0-1-.559-1-1.25"
        opacity="0.4"
      ></path>
    </svg>
  );
};
