
import { EvoCardPng } from "@/components/evo-card/evo-card";
import { Gender, IEvo, Nature, Rarity, Species, Type } from "@/components/evo-card/types";
import { ImageResponse } from 'next/server'
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest, { params }: { params: { tokenId: string }}) => {
  const tokenId = params.tokenId.replace(/[^0-9]/g,  '');
  console.log(tokenId)
  const resp = await fetch(`https://api.evoverses.com/metadata/evo/${tokenId}`, {
    next: {

    }
  })
  const metadata = await resp.json();
  console.log(metadata)
  const sizePct = metadata.attributes.find((a: any) => a.trait_type === "Size").value / 10;
  console.log({
    total: metadata.attributes.find((a: any) => a.trait_type === "Total Summons").value,
    remaining: 100,
    lastBreedTime: metadata.attributes.find((a: any) => a.trait_type === "Last Breed Time").value,
  })
  const evo: any = {
    attributes: {
      gender: Gender[metadata.attributes.find((a: any) => a.trait_type === "Gender").value],
      rarity: Rarity[metadata.attributes.find((a: any) => a.trait_type === "Rarity").value],
      primaryType: Type[metadata.attributes.find((a: any) => a.trait_type === "Primary Type").value],
      secondaryType: Type[metadata.attributes.find((a: any) => a.trait_type === "Secondary Type")?.value || "None"],
      nature: Nature[metadata.attributes.find((a: any) => a.trait_type === "Nature").value],
      size: sizePct > 0 ? 10 + sizePct : sizePct,
    },
    breeds: {
      total: metadata.attributes.find((a: any) => a.trait_type === "Total Summons").value,
      remaining: 100,
      lastBreedTime: metadata.attributes.find((a: any) => a.trait_type === "Last Breed Time").value,
    },
    experience: metadata.attributes.find((a: any) => a.trait_type === "XP").value,
    generation: metadata.attributes.find((a: any) => a.trait_type === "Generation").value,
    moves: { move0: 0, move1: 0, move2: 0, move3: 0 },
    owner: "",
    species: Species[metadata.attributes.find((a: any) => a.trait_type === "Species").value],
    stats: {
      health: 50,
      attack: metadata.attributes.find((a: any) => a.trait_type === "Attack").value,
      defense: metadata.attributes.find((a: any) => a.trait_type === "Defense").value,
      special: metadata.attributes.find((a: any) => a.trait_type === "Special").value,
      resistance: metadata.attributes.find((a: any) => a.trait_type === "Resistance").value,
      speed: metadata.attributes.find((a: any) => a.trait_type === "Speed").value,
    },
    tokenId: metadata.tokenId

  }

  console.log(evo)
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
