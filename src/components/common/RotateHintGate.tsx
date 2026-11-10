"use client";

import dynamic from "next/dynamic";

const RotateHint = dynamic(() => import("./RotateHint"), { ssr: false });

export function RotateHintGate() {
  return <RotateHint />;
}
