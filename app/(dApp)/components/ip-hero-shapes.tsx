"use client"
import { useEffect, useState } from "react"

export const Shape1 = () => {
  const [width, setWidth] = useState(1400)

  useEffect(() => {
    const handleResize = () => {
      setWidth((Math.min(window.innerWidth, 1400) * 1320) / 1400)
    }
    handleResize()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={(width * 1105) / 1320}
      viewBox="0 0 1320 1105"
      fill="none"
    >
      <g filter="url(#filter0_n_1172_2260)">
        <path
          d="M123.842 1083.55C-67.3715 749.994 109.547 498.25 316.386 466.564C574.935 426.957 771.641 701.062 898.594 312.965C1000.16 2.48783 1208.42 21.228 1299.86 69.4078"
          stroke="url(#paint0_linear_1172_2260)"
          strokeWidth="84"
        />
      </g>
      <defs>
        <filter
          id="filter0_n_1172_2260"
          x="0"
          y="0"
          width="1319.44"
          height="1104.44"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.6393442153930664 1.6393442153930664"
            stitchTiles="stitch"
            numOctaves="3"
            result="noise"
            seed="771"
          />
          <feComponentTransfer in="noise" result="coloredNoise1">
            <feFuncR type="linear" slope="2" intercept="-0.5" />
            <feFuncG type="linear" slope="2" intercept="-0.5" />
            <feFuncB type="linear" slope="2" intercept="-0.5" />
            <feFuncA
              type="discrete"
              tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="noise1Clipped" result="color1">
            <feFuncA type="table" tableValues="0 0.15" />
          </feComponentTransfer>
          <feMerge result="effect1_noise_1172_2260">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
          </feMerge>
        </filter>
        <linearGradient
          id="paint0_linear_1172_2260"
          x1="1379.11"
          y1="275.087"
          x2="6.94657"
          y2="803.789"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF0CFB" />
          <stop offset="1" stopColor="#B7E350" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export const Shape2 = () => {
  const [width, setWidth] = useState(1400)

  useEffect(() => {
    const handleResize = () => {
      setWidth((Math.min(window.innerWidth, 1400) * 1013) / 1400)
    }
    handleResize()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={(width * 887) / 1013}
      viewBox="0 0 1013 887"
      fill="none"
    >
      <g filter="url(#filter0_n_1172_2262)">
        <path
          d="M75.7314 14.2589C-35.9126 323.58 150.429 509.427 329.364 505.466C553.032 500.514 879.257 438.456 940.188 542.734C1003.91 651.788 949.169 734.754 927.358 880.16"
          stroke="url(#paint0_linear_1172_2262)"
          strokeWidth="84"
        />
      </g>
      <defs>
        <filter
          id="filter0_n_1172_2262"
          x="0"
          y="0"
          width="1012.05"
          height="886.39"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.6393442153930664 1.6393442153930664"
            stitchTiles="stitch"
            numOctaves="3"
            result="noise"
            seed="771"
          />
          <feComponentTransfer in="noise" result="coloredNoise1">
            <feFuncR type="linear" slope="2" intercept="-0.5" />
            <feFuncG type="linear" slope="2" intercept="-0.5" />
            <feFuncB type="linear" slope="2" intercept="-0.5" />
            <feFuncA
              type="discrete"
              tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="noise1Clipped" result="color1">
            <feFuncA type="table" tableValues="0 0.15" />
          </feComponentTransfer>
          <feMerge result="effect1_noise_1172_2262">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
          </feMerge>
        </filter>
        <linearGradient
          id="paint0_linear_1172_2262"
          x1="1252.96"
          y1="509.271"
          x2="18.7192"
          y2="267.249"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF0CFB" />
          <stop offset="1" stopColor="#B7E350" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export const Shape3 = () => {
  const [width, setWidth] = useState(1400)
  useEffect(() => {
    const handleResize = () => {
      setWidth((Math.min(window.innerWidth, 1400) * 676) / 1400)
    }
    handleResize()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={(width * 665) / 676}
      viewBox="0 0 676 665"
      fill="none"
    >
      <g filter="url(#filter0_d_1172_2264)">
        <path
          d="M66.5221 482.929C66.5221 482.929 281.719 380.658 216.408 606.841C307.181 427.033 392.889 377.346 618.332 418.721C464.353 360.823 409.215 278.278 597.717 180.947C597.717 180.947 394.941 274.846 362.887 57.5C357.668 294.059 206.228 270.245 57.5 180.637C57.5 180.637 316.741 337.034 66.5174 482.911L66.5221 482.929Z"
          fill="url(#paint0_linear_1172_2264)"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1172_2264"
          x="0"
          y="0"
          width="675.832"
          height="664.341"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="28.75" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1172_2264" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1172_2264" result="shape" />
        </filter>
        <linearGradient
          id="paint0_linear_1172_2264"
          x1="215.597"
          y1="156.846"
          x2="169.113"
          y2="556.449"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A650E3" />
          <stop offset="1" stopColor="#D191FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
