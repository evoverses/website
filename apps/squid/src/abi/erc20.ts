import { events as erc20EvoEvents, functions as erc20EvoFunctions, Contract } from "./generated/erc20-evo";

const events = {
  ...erc20EvoEvents,
};

const functions = {
  ...erc20EvoFunctions,
};

export {
  erc20EvoEvents,
  erc20EvoFunctions,
  events,
  functions,
  Contract,
};
