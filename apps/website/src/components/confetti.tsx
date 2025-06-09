"use client";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "usehooks-ts";

export const Confetti = () => {
  const { width, height } = useWindowSize();
  return (
    <div className="fixed z-100 left-0 top-0 right-0 bottom-0">
      <ReactConfetti
        width={width}
        height={height}
      />
    </div>
  );
};
