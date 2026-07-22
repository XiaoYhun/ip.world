"use client"

import { motion } from "framer-motion"

export default function SubmitSuccessScreen() {
  const circumference = 2 * Math.PI * 62

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      <div className="relative h-[128px] w-[128px]">
        {/* Background circle + clock */}
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none" className="absolute inset-0">
          <rect width="128" height="128" rx="64" fill="#242424" />
          <g clipPath="url(#clip0_submit)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M42 63.5C42 51.0736 52.0736 41 64.5 41C76.9263 41 87 51.0736 87 63.5C87 75.9263 76.9263 86 64.5 86C52.0736 86 42 75.9263 42 63.5ZM64.5 36.5C49.5883 36.5 37.5 48.5883 37.5 63.5C37.5 78.4117 49.5883 90.5 64.5 90.5C79.4117 90.5 91.5 78.4117 91.5 63.5C91.5 48.5883 79.4117 36.5 64.5 36.5ZM62.25 47.75V63.5C62.25 64.011 62.4239 64.5067 62.743 64.9056L71.743 76.1556L75.257 73.3444L66.75 62.7107V47.75H62.25Z"
              fill="#797979"
            />
          </g>
          <defs>
            <clipPath id="clip0_submit">
              <rect width="54" height="54" fill="white" transform="translate(37.5 36.5)" />
            </clipPath>
          </defs>
        </svg>
        {/* Orbiting purple arc */}
        <motion.svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          fill="none"
          className="absolute inset-0"
          style={{ transformOrigin: "center" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <motion.circle
            cx="64"
            cy="64"
            r="62"
            stroke="#A572ED"
            strokeWidth="3.44"
            strokeLinecap="round"
            fill="none"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset: [
                circumference * 0.75,
                circumference * 0.5,
                circumference * 0.75,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.svg>
      </div>

      <div className="font-archivo text-[28px] font-medium">Verification Submitted</div>
      <div className="flex max-w-[400px] flex-col gap-4 text-center text-neutral-200">
        <div>Your verification request has been submitted and is currently under review</div>
        <ul className="list-disc space-y-1 pl-10 text-left text-sm text-neutral-300">
          <li>Our team will review all information provided</li>
          <li>You may be contacted in case more details are needed</li>
          <li>
            Verification typically completes within <span className="font-semibold">7 business days</span>
          </li>
          <li>You will be notified once a decision has been made</li>
        </ul>
      </div>
    </div>
  )
}
