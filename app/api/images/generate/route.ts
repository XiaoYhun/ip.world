import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { env } from "@/config"

const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const prompt = formData.get("prompt") as string
    const promptImage = formData.get("prompt_image") as File | null
    const maskImage = formData.get("mask_image") as File | null
    const aspect_ratio = "1:1"
    const safety_tolerance = 2

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: any

    if (promptImage && maskImage) {
      const promptImageBase64 = await fileToBase64(promptImage)
      const maskImageBase64 = await fileToBase64(maskImage)

      const input = {
        image: promptImageBase64,
        mask: maskImageBase64,
        prompt,
        guidance_scale: 10,
        steps: 50,
        strength: 0.95,
        output_quality: 100,
        output_format: "webp",
      }

      output = await replicate.run(
        "lucataco/sdxl-inpainting:a5b13068cc81a89a4fbeefeccc774869fcb34df4dbc92c1555e0f2771d49dde7",
        { input }
      )

      output = output[0]
    } else if (promptImage && !maskImage) {
      const promptImageBase64 = await fileToBase64(promptImage)

      const input = {
        prompt: prompt,
        image_prompt: promptImageBase64,
        image_prompt_strength: 0.4,
        output_quality: 100,
        output_format: "webp",
      }

      output = await replicate.run("black-forest-labs/flux-1.1-pro-ultra", {
        input,
      })
    } else {
      const input = {
        raw: false,
        prompt,
        aspect_ratio,
        output_format: "webp",
        safety_tolerance,
      }

      output = await replicate.run("black-forest-labs/flux-1.1-pro-ultra", {
        input,
      })
    }

    // Return image response
    return new NextResponse(output, {
      headers: {
        "Content-Type": "image/webp",
      },
    })
  } catch (error) {
    console.error("Image Generation Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate image",
      },
      { status: 500 }
    )
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`
}
