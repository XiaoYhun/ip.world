import BigNumber from "bignumber.js"

export const bigNumberToFloat = (value: bigint | string, decimals: number): number => {
  const bn = new BigNumber(value ? value.toString() : 0)
  const divisor = new BigNumber(10).pow(decimals)

  // Divide and round down
  const result = bn.dividedBy(divisor).decimalPlaces(decimals, BigNumber.ROUND_DOWN)

  return result ? result.toNumber() : 0
}

export const floatToBigNumber = (value: number | string, decimals: number) => {
  return BigNumber(value).multipliedBy(BigNumber(10).pow(decimals))
}

export const formatBigNumber = (value: bigint | string, decimals: number) => {
  const bn = new BigNumber(value.toString()).dividedBy(BigNumber(10).pow(decimals))

  const decimalPlaces = bn.dp() // Get decimal places

  if (decimalPlaces && decimalPlaces > 3) {
    return bn.toFixed(3, BigNumber.ROUND_DOWN) // Cut to 3 decimals without rounding up
  }

  return bn.toString() // Keep as is if decimal places are 3 or less
}
