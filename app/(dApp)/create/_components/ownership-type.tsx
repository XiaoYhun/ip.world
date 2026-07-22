"use client"

import { Control, Controller, UseFormSetValue } from "react-hook-form"
import { CommunitySmall, Creator } from "@/components/icons"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ICreateTokenFormInputs } from "../ip/CreateTokenForm"

interface OwnershipTypeProps {
  control: Control<ICreateTokenFormInputs>
}

const OwnershipType = ({ control }: OwnershipTypeProps) => {
  return (
    <Controller
      name="ip.type"
      control={control}
      rules={{ min: 1, max: 5 }}
      render={({ field: { value, onChange } }) => (
        <motion.div className="flex flex-col gap-3">
          <div className="">
            <div className="mb-2 font-medium text-white">Create a new IP</div>
            <div className="text-xs font-light text-neutral-300">
              Choose the category that best describes your topic
            </div>
          </div>
          <div className="flex gap-1 rounded-full border border-neutral-600 p-1">
            {["creator", "community"].map((item) => (
              <div
                key={`ownership-type=${item}`}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-all select-none hover:brightness-120",
                  value === item ? "bg-purple-300 text-purple-700" : "bg-neutral-500 text-neutral-300"
                )}
                onClick={() => onChange(item)}
              >
                <span className={value === item ? "text-purple-700" : "text-neutral-300"}>
                  {item === "creator" ? <Creator size={14} /> : <CommunitySmall size={16} />}
                </span>
                <p className={cn("text-sm capitalize", value === item ? "text-purple-700" : "text-neutral-300")}>
                  {item}
                </p>
              </div>
            ))}
          </div>
          <div className="text-xs font-light text-neutral-300">
            {value === "creator"
              ? "For cultural phenomena that originated from a specific creator or source."
              : "For community-driven or emergent cultural phenomena."}
          </div>
        </motion.div>
      )}
    />
  )
}

export default OwnershipType
