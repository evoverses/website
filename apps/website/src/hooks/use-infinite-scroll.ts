"use client";

import { useEffect, useRef } from "react";

type UseInfiniteScrollProps = {
  isFetching: boolean;
  fetchNextPageAction: () => void; // Callback function to load more items
  hasNextPage: boolean; // Determines if there’s more data to load
};

export const useInfiniteScroll = ({ isFetching, fetchNextPageAction, hasNextPage }: UseInfiniteScrollProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetching) {
      return;
    }
    const current = bottomRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [ entry ] = entries;
        if (entry?.isIntersecting && !isFetching) {
          fetchNextPageAction();
        }
      },
      { threshold: 0.05 }, // Trigger when 5% of the element is in view
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [ fetchNextPageAction, hasNextPage, isFetching ]);

  return bottomRef;
};
