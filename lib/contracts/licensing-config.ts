import { getContractAddress } from "./addresses"
import { ATTACH_LICENSE_TERMS_FUNC, ATTACH_LICENSE_TERMS_SELECTOR, SET_LICENSING_CONFIG_SELECTOR } from "../constants"

/**
 * ABI for the setLicensingConfig function
 */
export const setLicensingConfigAbi = {
  type: "function",
  inputs: [
    { name: "ipId", internalType: "address", type: "address" },
    { name: "licenseTemplate", internalType: "address", type: "address" },
    { name: "licenseTermsId", internalType: "uint256", type: "uint256" },
    {
      name: "licensingConfig",
      internalType: "struct Licensing.LicensingConfig",
      type: "tuple",
      components: [
        { name: "isSet", internalType: "bool", type: "bool" },
        { name: "mintingFee", internalType: "uint256", type: "uint256" },
        { name: "licensingHook", internalType: "address", type: "address" },
        { name: "hookData", internalType: "bytes", type: "bytes" },
        {
          name: "commercialRevShare",
          internalType: "uint32",
          type: "uint32",
        },
        { name: "disabled", internalType: "bool", type: "bool" },
        {
          name: "expectMinimumGroupRewardShare",
          internalType: "uint32",
          type: "uint32",
        },
        {
          name: "expectGroupRewardPool",
          internalType: "address",
          type: "address",
        },
      ],
    },
  ],
  name: "setLicensingConfig",
  outputs: [],
  stateMutability: "nonpayable",
} as const

/**
 * ABI for IP Account state function
 */
export const ipAccountStateAbi = [
  {
    name: "state",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const

/**
 * Configuration for licensing permissions
 */
export const getLicensingPermissionsConfig = () => ({
  signer: getContractAddress("Operator"),
  accessController: getContractAddress("AccessController"),
  licensingModule: getContractAddress("LicensingModule"),
  attachLicenseTermsSelector: ATTACH_LICENSE_TERMS_SELECTOR,
  setLicensingConfigSelector: SET_LICENSING_CONFIG_SELECTOR,
  attachLicenseTermsFunc: ATTACH_LICENSE_TERMS_FUNC,
  setLicensingConfigFunc: setLicensingConfigAbi,
})
