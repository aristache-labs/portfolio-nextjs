import { IntroCurtain } from "./IntroCurtain";
import { RotateHintGate } from "@/components/common/RotateHintGate";

/** Effect flags share the existing visibility map; missing values preserve enabled defaults. */
export function HomepageEffects({ visibility }: { visibility: Record<string, boolean> }) {
  return (
    <>
      {visibility.intro !== false && <IntroCurtain />}
      {visibility.rotateHint !== false && <RotateHintGate />}
    </>
  );
}
