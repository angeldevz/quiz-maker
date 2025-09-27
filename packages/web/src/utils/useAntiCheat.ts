import { useEffect, useRef, useState } from "react";

export interface CheatStats {
  switchTabsEvents: number;
  pasteEvents: number;
}
export function useAntiCheat() {
  const docRef = useRef<Document>(document);
  const [switchTabsEvents, setSwitchTabsEvents] = useState(0);
  const [pasteEvents, setPasteEvent] = useState(0);

  useEffect(() => {
    const handlePaste = () => {
      setPasteEvent((prev) => prev + 1);
    };

    const handleVisibilityChange = () => {
      if (docRef.current.hidden) {
        setSwitchTabsEvents((prev) => prev + 1);
      }
    };

    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    switchTabsEvents,
    pasteEvents,
  } as CheatStats;
}
