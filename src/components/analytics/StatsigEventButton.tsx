"use client";

import { useStatsigClient } from "@statsig/react-bindings";
import { Button } from "@/components/ui/Button";

export function StatsigEventButton() {
  const { client } = useStatsigClient();

  return (
    <Button type="button" onClick={() => client.logEvent("my_custom_event")}>
      Click Me
    </Button>
  );
}
