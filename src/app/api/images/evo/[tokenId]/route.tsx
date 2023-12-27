import { EvoCardPng } from "@/components/evo-card/evo-card";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest, { params }: { params: { tokenId: string }}) => {
  const tokenId = params.tokenId.replace(/[^0-9]/g,  '');
  const resp = await fetch(`https://api.evoverses.com/metadata/evo/${tokenId}?raw=true`, {
    next: {
      tags: ['evo', tokenId],
      revalidate: 3_600,
    }
  })
  const metadata = await resp.json();
  const egg = "treated" in metadata;
  let evo;
  if (!egg) {
    const sizeValue = metadata.size;
    const sizePct = sizeValue / 10;
    evo = {
      attributes: {
        gender: metadata.gender,
        chroma: metadata.chroma === null ? "None" : metadata.chroma,
        primaryType: metadata.types.primary,
        secondaryType: metadata.types.secondary === null ? "None" : metadata.types.secondary,
        nature: metadata.nature,
        size: sizePct > 0 ? 10 + sizePct : sizePct,
      },
      breeds: {
        total: metadata.totalBreeds,
        remaining: 5 - metadata.totalBreeds,
        lastBreedTime: metadata.lastBreedTime ? Math.floor(Date.parse(metadata.lastBreedTime) / 1000) : 0,
      },
      experience: metadata.xp,
      generation: metadata.generation,
      moves: { move0: 0, move1: 0, move2: 0, move3: 0 },
      owner: "",
      species: metadata.species,
      stats: {
        health: 50,
        attack: metadata.attack,
        defense: metadata.defense,
        special: metadata.special,
        resistance: metadata.resistance,
        speed: metadata.speed,
      },
      tokenId: Number(tokenId)
    }
  } else {
    evo = {
      tokenId: Number(tokenId),
      species: metadata.species,
      generation: metadata.generation,
      owner: "",
      parents: [0, 0],
      treated: metadata.treated,
      attributes: {
        chroma: "None",
        primaryType: metadata.types.primary,
        secondaryType: metadata.types.secondary === null ? "None" : metadata.types.secondary,
      },
      createdAt: Math.floor(Date.parse(metadata.createdAt) / 1000),
    }
    if (evo.generation > 0 && metadata.parents && metadata.parents.length > 0) {
      evo.parents = metadata.parents.map((p: any) => Number(p.tokenId));
    }
  }

  const sizeMultiplier = 1;
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
    (<EvoCardPng evo={evo as any} multiplier={sizeMultiplier} baseUrl={baseUrl} />),
    {
      width: 512 * sizeMultiplier,
      height: 725 * sizeMultiplier,
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
