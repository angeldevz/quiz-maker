"use client";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { logEvent } from "./api";

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
  const [attemptId, setAttemptId] = useState<number>();
  const [tracking, setTracking] = useState(false);

  const { mutate } = useMutation({
    mutationFn: ({ attemptId, event }: { attemptId: number; event: string }) =>
      logEvent(attemptId, event),
  });

  const handlePaste = useCallback(() => {
    if (tracking) {
      setPasteEvent((prev) => [...prev, { timestamp: new Date() }]);
      if (attemptId) {
        mutate({ attemptId, event: "paste event" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, attemptId]);

  const handleSwitchTabs = useCallback(() => {
    if (tracking) {
      setSwitchTabsEvents((prev) => [...prev, { timestamp: new Date() }]);
      if (attemptId) {
        mutate({ attemptId, event: "switch event" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, attemptId]);

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

  function startTracking(attemptId: number) {
    setAttemptId(attemptId);
    setTracking(true);
  }

  function stopTracking() {
    setTracking(false);
  }

  return {
    switchTabsEvents,
    pasteEvents,
    startTracking,
    stopTracking,
  };
}
