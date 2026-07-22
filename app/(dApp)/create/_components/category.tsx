"use client"

import { Control, Controller } from "react-hook-form"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ICreateFormInputs } from "../ip/CreateIpForm"

interface CategoryProps {
  control: Control<ICreateFormInputs>
  showError?: boolean
}

const Category = ({ control, showError = true }: CategoryProps) => {
  return (
    <Controller
      name="category"
      rules={{ required: "Category is required" }}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm leading-normal font-normal text-neutral-300">Categories</label>
            <p className="text-sm text-neutral-400">{value ? 1 : 0}/1</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1 rounded-[6px] px-2 py-1.5 text-sm font-semibold transition-all",
                  {
                    "bg-white": value === c.key,
                    "bg-neutral-600": value !== c.key,
                  }
                )}
                onClick={() => {
                  if (value === c.key) {
                    onChange(null)
                  } else {
                    onChange(c.key)
                  }
                }}
              >
                <span className={cn(value !== c.key ? "text-neutral-300" : "text-black")}>{c.icon && <c.icon />}</span>
                <p
                  className={cn(
                    "leading-[100%] whitespace-nowrap",
                    value !== c.key ? "text-neutral-300" : "text-black"
                  )}
                >
                  {c.label}
                </p>
              </div>
            ))}
          </div>
          {showError && error && <div className="text-red text-sm">{error?.message}</div>}
        </div>
      )}
    />
  )
}

export default Category

// "use client"

// import { Control, Controller } from "react-hook-form"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { CATEGORIES } from "@/lib/constants"
// import { ICreateFormInputs } from "../ip/form"

// interface CategoryProps {
//   control: Control<ICreateFormInputs>
// }

// const Category = ({ control }: CategoryProps) => {
//   return (
//     <Controller
//       name="category"
//       rules={{ required: "Category is required" }}
//       control={control}
//       render={({ field: { value, onChange }, fieldState: { error } }) => (
//         <div className="flex flex-col gap-2">
//           <div className="flex justify-between">
//             <label className="text-sm leading-normal font-normal text-neutral-300">Categories</label>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             <Select value={value} onValueChange={onChange}>
//               <SelectTrigger className="h-8 w-full cursor-pointer !bg-[#0D0D0D80]">
//                 <SelectValue className="text-red" placeholder="Select An IP Category" />
//               </SelectTrigger>
//               <SelectContent className="w-full bg-black">
//                 {CATEGORIES.map((c) => {
//                   return (
//                     <SelectItem key={c.key} className="w-full cursor-pointer" value={c.key}>
//                       {c.label}
//                     </SelectItem>
//                   )
//                 })}
//               </SelectContent>
//             </Select>
//           </div>
//           {error && <div className="text-red text-sm">{error?.message}</div>}
//         </div>
//       )}
//     />
//   )
// }

// export default Category
