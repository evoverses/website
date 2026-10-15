import { avalancheFuji } from 'viem/chains';
import { isAddress, zeroAddress, type Address } from 'viem';
import { evoContractAddress, evoNftContractAddress } from '@/data/addresses';

// This release is deliberately Fuji-only. Marketplace and game assets stay on mainnet.
export const nurseryChain = avalancheFuji;
export const nurseryNetworkMessage = 'Fuji test mode · Test assets only';
const address = (value?: string): Address => value && isAddress(value, { strict: false }) && value !== zeroAddress ? value as Address : zeroAddress;
export const nurseryTokenAddress = address(process.env.NEXT_PUBLIC_FUJI_EVO_ADDRESS);
export const nurseryNftAddress = address(process.env.NEXT_PUBLIC_FUJI_EVO_NFT_ADDRESS);
export const nurseryBerthaAddress = address(process.env.NEXT_PUBLIC_FUJI_BERTHA_ADDRESS);
export const nurseryHermannAddress = address(process.env.NEXT_PUBLIC_FUJI_HERMANN_ADDRESS);
export const nurseryWrapperAddress = address(process.env.NEXT_PUBLIC_FUJI_WRAPPER_ADDRESS);
const configured = [nurseryTokenAddress, nurseryNftAddress, nurseryBerthaAddress, nurseryHermannAddress, nurseryWrapperAddress];
export const nurseryNetworkConfigured = configured.every(value => value !== zeroAddress && ![evoContractAddress.toLowerCase(), evoNftContractAddress.toLowerCase()].includes(value.toLowerCase())) && new Set(configured.map(value => value.toLowerCase())).size === 5;

export const chainlinkFujiWrapper = '0x327B83F409E1D5f13985c6d0584420FA648f1F56' as Address;
export const usesChainlinkRandomness = nurseryWrapperAddress.toLowerCase() === chainlinkFujiWrapper.toLowerCase();

// ABI capabilities are selected explicitly; existing Fuji deployments remain supported.
export const nurseryRegistryVersion = process.env.NEXT_PUBLIC_NURSERY_REGISTRY_VERSION === "2" ? 2 : 1;

// Previous Fuji registries retain canonical birth/hatch/parent metadata for preserved adults.
export const nurseryHermannHistory = [...new Set((process.env.NEXT_PUBLIC_FUJI_HERMANN_HISTORY ?? "").split(",").slice(0, 4).map(value => address(value.trim())))].filter(value => value !== zeroAddress && value.toLowerCase() !== nurseryHermannAddress.toLowerCase() && ![evoContractAddress.toLowerCase(), evoNftContractAddress.toLowerCase()].includes(value.toLowerCase()));
