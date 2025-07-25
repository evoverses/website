"use client"; // Error components must be Client Components

import type { ErrorPageProps } from "@/types/core";
import { HomeIcon, ReloadIcon } from "@radix-ui/react-icons";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { useEffect } from "react";

const Error = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [ error ]);

  return (
    <main className="flex flex-col flex-grow items-center justify-center space-y-6 text-center">
      <div>
        <h1 className="text-5xl font-medium">Sorry!</h1>
        <h3 className="text-xl text-muted-foreground !mt-0">
          Something went wrong on our end
        </h3>
      </div>
      <div className="flex gap-4">
        <Button size="lg" asChild className="font-bold">
          <Link href="/apps/website/public" prefetch={false}>
            <HomeIcon className="w-6 h-6 mr-2" />
            <span>Go Home</span>
          </Link>
        </Button>
        <Button variant="warning" size="lg" className="font-bold" onClick={() => reset()}>
          <ReloadIcon className="w-6 h-6 mr-2" />
          <span>Try Again?</span>
        </Button>
      </div>
    </main>
  );
};

export default Error;
