"use client";
import React from "react";
// import { Player } from "@lottiefiles/react-lottie-player";

const AnimatedBackground = ({ children }) => {
  return (
    <div>
      {/* <Player
        autoplay
        loop
        src={withBasePath("/sts-bg.json")}
        rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        className="animatedBackground"
      /> */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "black",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;
