"use client"

import Image from "next/image"
import IPCard from "../_components/IPCard"
import SkeletonIpCard from "../_components/SkeletonIpCard"
import { MOCK_IP, MOCK_TOKEN } from "@/constants/mockData"
import { AnimatePresence, motion } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { UseFormReturn } from "react-hook-form"
import { ICreateFormInputs } from "./CreateIpForm"
import { Ip, IP_STATUS } from "@/types/ip"
import { Remix } from "@/types/remix"
import SkeletonTokenCard from "../_components/SkeletonTokenCard"
import { ICreateTokenFormInputs } from "./CreateTokenForm"
import { FormStep } from "./CreateIpPageClient"

import { Skeleton } from "@/components/ui/skeleton"
import CategoryPills from "@/components/category-pills"
import { SOCIAL_TYPE } from "@/components/socials"

interface RightSideViewProps {
  formIPMethods?: UseFormReturn<ICreateFormInputs>
  formTokenMethods: UseFormReturn<ICreateTokenFormInputs>
  formStep: number
  ipData?: Ip // Direct IP data when accessed from /create/ip/[id]
}

export default function RightSideView({ formIPMethods, formTokenMethods, formStep, ipData }: RightSideViewProps) {
  // Always show initial animation first, unless we've already interacted
  const [isInitial, setIsInitial] = useState(true)

  // Watch form fields or use ipData
  const title = ipData?.title || formIPMethods?.watch("title") || ""
  const description = ipData?.description || formIPMethods?.watch("description") || ""
  const image = ipData?.image || formIPMethods?.watch("image") || ""
  const category = ipData?.category || formIPMethods?.watch("category") || ""
  const type = ipData?.type || formIPMethods?.watch("type") || "creator"
  const owner_account = ipData?.owner_account || formIPMethods?.watch("owner_account") || ""
  const owner_account_type = ipData?.owner_account_type || formIPMethods?.watch("owner_account_type") || ""

  const name = formTokenMethods.watch("name")
  const symbol = formTokenMethods.watch("symbol")
  const tokenImage = formTokenMethods.watch("image")
  const tokenDescription = formTokenMethods.watch("description")
  const socials = formTokenMethods.watch("socials") || {}

  // Construct IP object from form values
  const previewIp = useMemo<Partial<Ip>>(
    () => ({
      title: title || "",
      description: description || "",
      image: image || "",
      category: category || "",
      type: type || "creator",
      owner_account: owner_account || "",
      owner_account_type: (owner_account_type as any) || "",
    }),
    [title, description, image, category, type, owner_account, owner_account_type]
  )

  const previewToken = useMemo<Partial<Remix>>(
    () => ({
      name: name || "",
      symbol: symbol || "",
      description: tokenDescription || "",
      image: tokenImage || "",
      socials: socials as unknown as Record<SOCIAL_TYPE, string> || {},
    }),
    [name, symbol, tokenDescription, tokenImage, socials]
  )
  const ipHasInfo = title || description || image || category
  const tokenHasInfo = name || symbol || tokenImage || tokenDescription

  useEffect(() => {
    if (!isInitial) return

    if (tokenHasInfo) {
      setIsInitial(false)
    }
  }, [ipHasInfo, tokenHasInfo, ipData, isInitial])

  return (
    <div className="flex h-full max-h-[700px] w-full flex-col items-center justify-center gap-4">
      <AnimatePresence mode="wait">
        {/** IP Card Preview */}
        {isInitial ? (
          <motion.div
            key="initial-cards"
            initial="hidden"
            animate={isInitial ? "visible" : "exit"}
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { when: "beforeChildren" } },
              exit: { opacity: 0, transition: { when: "afterChildren" } },
            }}
            className="flex w-full flex-col items-center gap-4"
          >
            <div className="relative -mt-10 mb-4 h-[300px] w-full max-w-[800px] overflow-hidden">
              <motion.div
                key="gradient-mask"
                transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 },
                  exit: { opacity: 0, transition: { delay: 0.2, duration: 0.5 } },
                }}
                className="absolute right-0 bottom-0 left-0 z-[10] h-[2px] bg-gradient-to-r from-transparent via-purple-200 to-transparent"
              ></motion.div>
              <motion.div
                key="radial-gradient"
                transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
                variants={{
                  hidden: { opacity: 0, top: "140%" },
                  visible: { opacity: 1, top: "90%" },
                  exit: { opacity: 0, top: "140%", transition: { delay: 0.2, duration: 0.5 } },
                }}
                className="absolute top-1/2 left-1/2 -z-[1] h-[500px] w-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  background: "radial-gradient(65% 72% ellipse, rgba(148, 74, 255, 0.3) 0%, rgba(148, 74, 255, 0) 70%)",
                }}
              ></motion.div>

              {/** Center Card */}
              <motion.div
                key="center-card"
                transition={{ delay: 1.5, type: "spring", visualDuration: 0.5, bounce: 0.35 }}
                variants={{
                  hidden: { y: 250, rotate: 10, scale: 1 },
                  visible: { y: 0, rotate: 0, scale: 1 },
                  exit: {
                    y: 250,
                    rotate: 10,
                    scale: 1,
                    transition: { delay: 0 },
                  },
                }}
                className="pointer-events-auto absolute -bottom-2 left-1/2 z-[3] -translate-x-1/2 rounded-[12px]"
              >
                <IPCard ip={MOCK_IP} />
              </motion.div>

              {/** Right Card */}
              <motion.div
                key="right-card"
                variants={{
                  hidden: { y: 250, rotate: 10 },
                  visible: { y: 20, rotate: -11 },
                  exit: { y: 250, rotate: 10, transition: { delay: 0.2 } },
                }}
                transition={{ delay: 1.75, type: "spring", visualDuration: 0.53, bounce: 0.38 }}
                className="absolute -bottom-2 left-1/2 z-[1] -translate-x-[85%] scale-[0.9] rounded-[12px]"
              >
                <IPCard ip={MOCK_IP} />
              </motion.div>
              {/** Left Card */}
              <motion.div
                key="left-card"
                variants={{
                  hidden: { y: 250, rotate: 6 },
                  visible: { y: 30, rotate: 12 },
                  exit: { y: 250, rotate: 16, transition: { delay: 0.1 } },
                }}
                transition={{ delay: 2, type: "spring", visualDuration: 0.57, bounce: 0.4 }}
                className="absolute -bottom-2 left-1/2 z-[2] -translate-x-[20%] rounded-[12px]"
              >
                <IPCard ip={MOCK_IP} />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: "easeInOut" }}
              className="font-archivo text-2xl text-white"
            >
              Create a new culture market
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeInOut" }}
              className="w-[370px] text-center text-sm text-neutral-200"
            >
              Turn your ideas into culture markets that reward the creators and communities that grow them
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="preview-token-card"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 20, transition: { duration: 0.1, when: "afterChildren" } },
            }}
            transition={{ duration: 1 }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* <motion.div
              layoutId="ip-card"
              className="absolute top-6 left-6 rounded-[16px] border p-3"
              style={{
                boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.50)",
                backgroundColor: "rgba(25, 25, 25, 0.55)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div className="flex gap-2">
                <div className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-[8px]">
                  {previewIp.image ? (
                    <Image src={previewIp.image} alt={"preview token image"} className="object-cover" fill />
                  ) : (
                    <Skeleton className="h-full w-full" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {previewIp.category ? (
                    <CategoryPills
                      ip={previewIp as Ip}
                      className="border-black/30 bg-black/40 text-neutral-100 shadow-none!"
                    />
                  ) : (
                    <Skeleton className="h-4.5 w-20 rounded-full" />
                  )}
                  {previewIp.title ? (
                    <div className="font-archivo text-base font-medium">{previewIp.title}</div>
                  ) : (
                    <Skeleton className="h-5 w-28 rounded-full" />
                  )}
                </div>
              </div>
            </motion.div> */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 50, scale: 1.3 },
                visible: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: 50, scale: 1.3 },
              }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div
                className="absolute inset-0 -z-1 rounded-full opacity-40 blur-[100px]"
                style={{
                  background:
                    "conic-gradient(from 180deg at 50% 50%, #00EEC6 0deg, #FFC525 122.88461208343506deg, #FF0CFB 238.84616374969482deg, #06ABE7 301.1538362503052deg, #00EEC6 360deg)",
                }}
              ></div>
              <SkeletonTokenCard token={previewToken} ip={previewIp as Partial<Ip>} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
