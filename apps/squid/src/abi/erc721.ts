import { events as erc721EvoEvents, functions as erc721EvoFunctions } from "./generated/erc721-evo";
import {
  events as erc721SeaDropEvents,
  functions as erc721SeaDropFunctions,
} from "./generated/erc721-sea-drop-partial";
import {
  events as erc721ThirdwebDropEvents,
  functions as erc721ThirdwebDropFunctions,
} from "./generated/erc721-thirdweb-drop";

const events = {
  ...erc721SeaDropEvents,
  ...erc721ThirdwebDropEvents,
  ...erc721EvoEvents,
};

const functions = {
  ...erc721SeaDropFunctions,
  ...erc721ThirdwebDropFunctions,
  ...erc721EvoFunctions,
};

export {
  erc721SeaDropEvents,
  erc721ThirdwebDropEvents,
  erc721EvoEvents,
  erc721SeaDropFunctions,
  erc721ThirdwebDropFunctions,
  erc721EvoFunctions,
  events,
  functions,
};
