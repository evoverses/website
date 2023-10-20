
import { EvoCardPng } from "@/components/evo-card/evo-card";
import { IEvo } from "@/components/evo-card/types";
import { ImageResponse } from 'next/server'
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest, { params: { tokenId } }: { params: { tokenId: string }}) => {
  const resp = await fetch(`https://api.evoverses.com/metadata/evo/${tokenId}`, {
    next: {
      tags: ["evo", "5"],
      revalidate: 86400,
    }
  })
  const metadata = await resp.json();

  const evo: IEvo = {
    attributes: {
      gender: metadata.attributes.find((a: any) => a.trait_type === "gender").value,
      rarity: metadata.attributes.find((a: any) => a.trait_type === "rarity").value,
      primaryType: metadata.attributes.find((a: any) => a.trait_type === "primaryType").value,
      secondaryType: metadata.attributes.find((a: any) => a.trait_type === "secondaryType").value,
      nature: metadata.attributes.find((a: any) => a.trait_type === "nature").value,
      size: metadata.attributes.find((a: any) => a.trait_type === "size").value,
    },
    breeds: {
      total: metadata.attributes.find((a: any) => a.trait_type === "total").value,
      remaining: 100,
      lastBreedTime: metadata.attributes.find((a: any) => a.trait_type === "lastBreedTime").value,
    },
    experience: metadata.attributes.find((a: any) => a.trait_type === "experience").value,
    generation: metadata.attributes.find((a: any) => a.trait_type === "generation").value,
    moves: { move0: 0, move1: 0, move2: 0, move3: 0 },
    owner: "",
    species: metadata.attributes.find((a: any) => a.trait_type === "species").value,
    stats: {
      health: 50,
      attack: metadata.attributes.find((a: any) => a.trait_type === "attack").value,
      defense: metadata.attributes.find((a: any) => a.trait_type === "defense").value,
      special: metadata.attributes.find((a: any) => a.trait_type === "special").value,
      resistance: metadata.attributes.find((a: any) => a.trait_type === "resistance").value,
      speed: metadata.attributes.find((a: any) => a.trait_type === "speed").value,
    },
    tokenId: metadata.tokenId

  }
  const sizeMultiplier = 2;
  const baseUrl = req.url.split('/api')[0];
  const nunito = await fetch(
    new URL(`/fonts/Nunito.ttf`, baseUrl)
  ).then((res) => res.arrayBuffer());
  const nunitoBold = await fetch(
    new URL(`/fonts/Nunito-Bold.ttf`, baseUrl)
  ).then((res) => res.arrayBuffer());
  const nunitoSemiBold = await fetch(
    new URL(`/fonts/Nunito-SemiBold.ttf`, baseUrl)
  ).then((res) => res.arrayBuffer());
  return new ImageResponse(
    (<EvoCardPng evo={evo} multiplier={sizeMultiplier} baseUrl={baseUrl} />),
    {
      width: 236 * sizeMultiplier,
      height: 342 * sizeMultiplier,
      fonts: [
        {
          name: 'Nunito',
          data: nunito,
          weight: 400,
          style: 'normal'
        },
        {
          name: 'Nunito',
          data: nunitoSemiBold,
          weight: 500,
          style: 'normal'
        },
        {
          name: 'Nunito',
          data: nunitoBold,
          weight: 900,
          style: 'normal'
        }
      ]
    }
  );
};
