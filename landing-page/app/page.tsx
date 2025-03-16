"use client"

import { useState } from "react";
import Card from "@/components/home/card";
import { Github, Twitter } from "@/components/shared/icons";
import WebVitals from "@/components/home/web-vitals";
import ComponentGrid from "@/components/home/component-grid";
import { nFormatter } from "@/lib/utils";

export default async function Home() {
  const [openPopover, setOpenPopover] = useState(false);
  const { stargazers_count: stars } = await fetch(
    "https://api.github.com/repos/justice-rest/bbh",
    {
      ...(process.env.GITHUB_OAUTH_TOKEN && {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_OAUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }),
      // data will revalidate every 24 hours
      next: { revalidate: 86400 },
    },
  )
    .then((res) => res.json())
    .catch((e) => console.log(e));

  return (
    <>
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <a
          href="https://twitter.com/"
          target="_blank"
          rel="noreferrer"
          className="mx-auto mb-5 flex max-w-fit animate-fade-up items-center justify-center space-x-2 overflow-hidden rounded-full bg-blue-100 px-7 py-2 transition-colors hover:bg-blue-200"
        >
          <Twitter className="h-5 w-5 text-[#1d9bf0]" />
          <p className="text-sm font-semibold text-[#1d9bf0]">
            Introducing BHH
          </p>
        </a>
        <h1
          className="animate-fade-up bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm [text-wrap:balance] md:text-7xl md:leading-[5rem]"
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
        >
          Your Romantic Life
          <br />
              <span className="bg-co bg-gradient-to-r from-blue-500 via-green-600 to-indigo-500 bg-clip-text text-transparent">
                Now Cooked
              </span>
        </h1>
        <p
          className="mt-6 animate-fade-up text-center text-gray-500 opacity-0 [text-wrap:balance] md:text-xl"
          style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
        >
          The greatest collective of tools dedicated to roasting you :D
        </p>
        <div className="flex flex-col items-center justify-center mt-6 animate-fade-up opacity-0" 
        style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <div className="flex space-x-3">
            <a
              className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm text-gray-600 shadow-md transition-colors hover:border-gray-800"
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github />
              <p>
                <span className="hidden sm:inline-block">Upvote on</span> Podium{" "}
                <span className="font-semibold">{nFormatter(stars)}</span>
              </p>
            </a>
            <ComponentGrid />
          </div>
        </div>
      </div>
    </>
  );
}