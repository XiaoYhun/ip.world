"use client"

import ImageUploader from "@/components/image-uploader"
// import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { TagInput } from "@/components/ui/tag-input"
// import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Instagram, Telegram, Tiktok, Twitter, Website } from "@/components/icons"

const TokenDetail = ({
  formData,
  handleChange,
}: {
  formData: Record<string, string | boolean | number>
  handleChange: (name: string, value: string | boolean | number) => void
}) => {
  const handleTokenImageUpload = async (imageUrl: string) => {
    handleChange("image", imageUrl)
  }

  return (
    <>
      <div className="flex w-full flex-col gap-5 md:flex-row">
        <ImageUploader label="token cover" required handleFileChange={handleTokenImageUpload} />
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex gap-3">
            <Input
              label="token name"
              name="name"
              id="name"
              required
              wrapperclassname="flex-1"
              placeholder="[token name]"
              value={formData.name as string}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <Input
              label="ticker"
              name="symbol"
              id="symbol"
              required
              className="text-brand"
              wrapperclassname="max-w-[175px]"
              placeholder="$ticker"
              value={formData.symbol as string}
              onChange={(e) => handleChange("symbol", e.target.value)}
            />
          </div>
          <Textarea
            label="description"
            name="description"
            id="description"
            required
            wrapperclassname="flex-1"
            className="flex-1"
            placeholder="token description"
            value={formData.description as string}
            onChange={(e) => handleChange("description", e.target.value)}
          />
          <TagInput
            label={
              <>
                tags<span className="ml-1 font-normal text-neutral-300">choose up to 10 tags</span>
              </>
            }
            onChange={(newTags) => handleChange("tags", newTags)}
            wrapperclassname="flex-1"
            placeholder="ooiiaa, pet, tiktok meme, cat..."
          />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-normal">token socials</label>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            prefixEl={
              <span>
                <Twitter size={16} />
              </span>
            }
            name="twitter"
            id="twitter"
            placeholder="username"
            wrapperclassname="flex-1"
            value={formData.twitter as string}
            onChange={(e) => handleChange("twitter", e.target.value)}
          />
          <Input
            prefixEl={
              <span>
                <Instagram size={16} />
              </span>
            }
            name="instagram"
            id="instagram"
            wrapperclassname="flex-1"
            placeholder="username"
            value={formData.instagram as string}
            onChange={(e) => handleChange("instagram", e.target.value)}
          />
          <Input
            prefixEl={
              <span>
                <Tiktok size={16} />
              </span>
            }
            name="tiktok"
            id="tiktok"
            wrapperclassname="flex-1"
            placeholder="username"
            value={formData.tiktok as string}
            onChange={(e) => handleChange("tiktok", e.target.value)}
          />
          <Input
            prefixEl={
              <span>
                <Telegram size={16} />
              </span>
            }
            name="telegram"
            id="telegram"
            wrapperclassname="flex-1"
            placeholder="username"
            value={formData.telegram as string}
            onChange={(e) => handleChange("telegram", e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-normal">token website</label>
        <Input
          prefixEl={
            <span>
              <Website size={16} />
            </span>
          }
          name="website"
          id="website"
          placeholder="www.website.com"
          wrapperclassname="max-w-[400px] w-full"
          value={formData.website as string}
          onChange={(e) => handleChange("website", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="text-sm leading-normal font-normal">ip owner allocation: 3%</label>
            <p className="text-xs leading-normal font-normal">
              tokens will be locked over 3 months follow ip owner verification
            </p>
          </div>
          {/* <Input
            type="number"
            min={3}
            max={15}
            name="allocation"
            id="allocation"
            className="text-end"
            wrapperclassname="max-w-20 h-10 bg-neutral-2000"
            suffixEl="%"
            value={formData.allocation as number}
            onChange={(e) => handleChange("allocation", Number(e.target.value))}
          /> */}
        </div>
        {/* <Slider
          value={[formData.allocation as number]}
          max={15}
          min={3}
          step={1}
          onValueChange={(value) => handleChange("allocation", value[0])}
        /> */}
      </div>
      {/* <div className="mt-7 flex flex-col gap-4">
        <label className="text-sm font-normal leading-normal">anti-snipe protection</label>
        <Checkbox label="add anti-snipe protection" name="anti_snipe" id="anti_snipe" />
      </div> */}
    </>
  )
}

export default TokenDetail
