import { cn } from "@/lib/utils"
import { Ip } from "@/types/ip"
import { VERIFICATION_CRITERIA, normalizeCategoryKey } from "@/lib/verification-criteria"
import { useVerificationForm } from "../form-context"

const titleCase = (s: string) => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")

export default function IPInformationReasoningScreen({ ip, attempted }: { ip: Ip; attempted?: boolean }) {
  const form = useVerificationForm()
  const ipName = titleCase(ip.title)
  const categoryKey = normalizeCategoryKey(ip.category)
  const criteria = VERIFICATION_CRITERIA[categoryKey]
  const value = form.watch("ip_description_reasoning")
  const showError = attempted && !value?.trim()
  return (
    <div className="min-h-[540px] rounded-[16px] border bg-neutral-800 p-6">
      <div className="flex h-[490px] flex-col gap-5">
        <div>
          <div className="font-archivo mb-2 text-[24px] font-medium">Verification Eligibility</div>
          <div className="font-archivo text-sm text-neutral-100">
            First, describe why you think {ipName} is eligible for verification. To qualify, it must reach a certain level of cultural influence or community support.
          </div>
        </div>

        <div>
          <div
            className="rounded-[12px] border border-purple-200 bg-purple-300/10 p-4 text-purple-100"
            style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
          >
            <div className="mb-2 flex items-center gap-1.5 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M6.86 8.232C6.69042 8.232 6.52458 8.28228 6.38359 8.37655C6.2426 8.4707 6.1327 8.60463 6.06783 8.76132C6.00285 8.91806 5.98587 9.09043 6.01895 9.2568C6.05208 9.42311 6.13375 9.57594 6.25362 9.69582C6.3735 9.81569 6.52639 9.89742 6.6927 9.93055C6.85906 9.96357 7.0315 9.94665 7.18818 9.88173C7.34486 9.8168 7.47874 9.7069 7.57295 9.56591C7.66721 9.42486 7.7175 9.25908 7.7175 9.0895C7.7175 8.86206 7.62714 8.64395 7.46637 8.48312C7.30555 8.32236 7.08738 8.232 6.86 8.232ZM6.86 7.203C7.04194 7.203 7.21641 7.13067 7.34504 7.00204C7.47366 6.87342 7.546 6.69894 7.546 6.517V4.459C7.546 4.27706 7.47366 4.10258 7.34504 3.9739C7.21641 3.84528 7.04194 3.773 6.86 3.773C6.67805 3.773 6.50352 3.84528 6.3749 3.9739C6.24633 4.10258 6.174 4.27706 6.174 4.459V6.517C6.174 6.69894 6.24633 6.87342 6.37495 7.00204C6.50358 7.13067 6.67805 7.203 6.86 7.203ZM6.86 0C5.50322 0 4.1769 0.402325 3.04879 1.15611C1.92068 1.90989 1.04142 2.9813 0.522196 4.23477C0.00297101 5.48829 -0.132887 6.86758 0.131829 8.19828C0.396546 9.52898 1.04988 10.7513 2.00923 11.7108C2.96864 12.6701 4.19095 13.3235 5.52165 13.5882C6.85235 13.8529 8.2317 13.717 9.48517 13.1978C10.7387 12.6786 11.8101 11.7993 12.5639 10.6712C13.3177 9.5431 13.72 8.21677 13.72 6.86C13.718 5.04123 12.9946 3.29752 11.7085 2.01145C10.4225 0.725433 8.67877 0.00204167 6.86 0ZM6.86 12.348C5.77459 12.348 4.7135 12.0261 3.81103 11.4231C2.90855 10.8201 2.20511 9.96298 1.78978 8.96017C1.37439 7.95737 1.26571 6.85388 1.47746 5.78935C1.68921 4.72477 2.21188 3.74692 2.97943 2.97937C3.74692 2.21188 4.72476 1.68922 5.78935 1.47747C6.85387 1.26572 7.95736 1.37439 8.96017 1.78972C9.96298 2.20512 10.8201 2.9085 11.4231 3.81103C12.0261 4.71351 12.348 5.77453 12.348 6.86C12.3464 8.31501 11.7676 9.70993 10.7388 10.7388C9.70993 11.7676 8.315 12.3464 6.86 12.348Z"
                  fill="#DFCDF9"
                />
              </svg>
              <span className="font-semibold capitalize">{categoryKey}</span> Token Eligibility Criteria
            </div>
            <ol className="list-decimal pl-4">
              {criteria?.map((criterion: string) => (
                <li key={criterion} className="text-xs leading-[20px]!">
                  {criterion}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <textarea
            {...form.register("ip_description_reasoning")}
            className={cn(
              "min-h-[180px] w-full flex-1 rounded-[12px] border bg-neutral-700 p-4 outline-none placeholder:text-neutral-300"
            )}
            placeholder="Describe why this token qualifies for verification"
            style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
          />
          {showError && (
            <p className="text-xs text-red-400">Please provide eligibility details to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}
