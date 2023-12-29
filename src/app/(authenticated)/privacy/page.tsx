"use client";
import { useEffect } from "react";

export const revalidate = false;

const Page = () => {

  useEffect(() => {
    let js, tjs = document.getElementsByTagName("script")[0];
    if (document.getElementById("termly-jssdk")) {
      return;
    }
    js = document.createElement("script");
    js.id = "termly-jssdk";
    js.src = "https://app.termly.io/embed-policy.min.js";
    tjs.parentNode?.insertBefore(js, tjs);
  }, []);

  return (
    <>
      <div
        // @ts-ignore name property....
        name="termly-embed"
        data-id="836ee923-8be7-4ffb-8bba-e53a9aebe6fe"
        className="overflow-y-scroll max-h-[calc(100vh-64px)]"
      />
    </>
  );
};

export default Page;
