"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";

// Chromium exposes the previous same-origin entry, including client-side navigation.
// Other browsers can use the document referrer or the collection fallback.
type NavigationHistory = {
  currentEntry?: { index: number };
  entries: () => { url?: string }[];
};

export function AssetBackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  function goBack() {
    const navigation = (window as Window & { navigation?: NavigationHistory }).navigation;
    const index = navigation?.currentEntry?.index ?? -1;
    const previous = navigation ? navigation.entries()[index - 1]?.url : document.referrer;
    if (previous && window.history.length > 1) {
      try {
        const url = new URL(previous);
        if (url.origin === window.location.origin && url.href !== window.location.href) {
          router.back();
          return;
        }
      } catch {
        // An inaccessible or invalid previous entry falls back to the collection.
      }
    }
    router.push(fallback);
  }
  return (
    <Button variant="outline" size="sm" onClick={goBack}>
      <ArrowLeftIcon aria-hidden="true" />
      Back
    </Button>
  );
}
