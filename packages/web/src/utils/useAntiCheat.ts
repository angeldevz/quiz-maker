import { useCallback, useEffect, useRef, useState } from "react";

interface TimestampData {
  timestamp: Date;
}
export interface CheatStats {
  switchTabsEvents: TimestampData[];
  pasteEvents: TimestampData[];
}
export function useAntiCheat() {
  const docRef = useRef<Document>(document);
  const [switchTabsEvents, setSwitchTabsEvents] = useState<TimestampData[]>([]);
  const [pasteEvents, setPasteEvent] = useState<TimestampData[]>([]);

  const handlePaste = useCallback(() => {
    setPasteEvent((prev) => [...prev, { timestamp: new Date() }]);
  }, []);

  const handleSwitchTabs = useCallback(() => {
    setSwitchTabsEvents((prev) => [...prev, { timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (docRef.current.hidden) {
        handleSwitchTabs();
      }
    };

    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleSwitchTabs);

    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleSwitchTabs);
    };
  }, [handlePaste, handleSwitchTabs]);

  function resetStats() {
    setPasteEvent([]);
    setSwitchTabsEvents([]);
  }

  return {
    switchTabsEvents,
    pasteEvents,
    resetStats,
  };
}
