import { Tweet } from "react-tweet"
import { Feed } from "@/types/feed"

const TwitterEmbed = (feed: Feed) => {
  return (
    <div data-theme="dark" className="twitter-embed-wrapper w-[325px]">
      <style jsx>{`
        :global(.react-tweet-theme) {
          --tweet-bg-color: var(--background) !important;
          --tweet-bg-color-hover: var(--neutral-600) !important;
          --tweet-border: 1px solid var(--neutral-3000) !important;
          --tweet-container-margin: 0 auto 18px !important;
          --tweet-body-font-size: 16px !important;
        }
      `}</style>
      <Tweet id={feed.uid} />
    </div>
  )
}

export default TwitterEmbed
