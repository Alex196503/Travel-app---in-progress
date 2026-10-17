import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import express from "express"
import { orchestrator } from "~/mcp/mcp-client"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import type { APIResponse } from "~/types/feature-types"
import { checkCooldown, setCooldown } from "~/utils/node-utils"
import {
  chatBodySchema,
  type ChatRequestBody
} from "~/utils/validation/zod-validation"

export const PromptRouter = express.Router()
PromptRouter.post(
  "/ai",
  authentificationMiddleware,
  async (
    req: Request<{}, {}, ChatRequestBody>,
    res: Response<
      APIResponse | { success: boolean; message: string }
    >,
    next: NextFunction
  ) => {
    try {
      const cooldownTime = 5 * 60 * 1000
      const validationResult = chatBodySchema.safeParse(req.body)
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.format()
        })
      }
      const { prompt } = validationResult.data
      const { isCooldown, remainingMinutes, remainingSeconds } =
        checkCooldown(
          "askGemini",
          req.user?.id as string,
          cooldownTime
        )
      if (isCooldown) {
        return res
          .status(429)
          .set("Retry-After", remainingSeconds?.toString())
          .json({
            success: false,
            message: `Too many requests. Please wait about ${remainingMinutes} minutes before trying again.`
          })
      }
      const result = await orchestrator.askGemini(prompt)
      setCooldown("askGemini", req.user?.id as string, cooldownTime)
      return res.status(200).json(result)
    } catch (error) {
      return next(error)
    }
  }
)
