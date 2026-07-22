import { Ip, IP_STATUS } from "@/types/ip"

export enum IP_VERIFICATION_STATUS {
  COMMUNITY = 0,
  READY_TO_REGISTER = 1,
  REGISTERED = 2,
  CLAIMED = 3,
}

const useIpStatus = (ip: Ip) => {
  const { moderator_verification_status } = ip

  if (ip.status === IP_STATUS.CLAIMED) {
    return IP_VERIFICATION_STATUS.CLAIMED
  } else if (ip.status === IP_STATUS.REGISTERED) {
    return IP_VERIFICATION_STATUS.REGISTERED
  } else if (ip.status === IP_STATUS.PRE_REGISTERED && moderator_verification_status === 1) {
    return IP_VERIFICATION_STATUS.READY_TO_REGISTER
  } else {
    return IP_VERIFICATION_STATUS.COMMUNITY
  }
}

export default useIpStatus
