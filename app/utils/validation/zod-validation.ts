import * as z from "zod"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]

export const RegisterSchema = z
  .object({
    name: z
      .string("The username is required")
      .min(3, "The username must be at least 3 characters long")
      .max(15, "The username cannot exceed 15 characters"),
    email: z
      .string("The email is required")
      .email("Invalid email address")
      .min(10, "Email must be at least 10 characters long"),
    password: z
      .string("The password is required")
      .min(6, "Password must be at least 6 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
        "Password must contain at least one letter and one number"
      ),
    confirmPassword: z.string("Confirm password is required")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })

export const FileValidationSchema = z.object({
  originalname: z.string(),
  filename: z.string(),
  mimetype: z
    .string()
    .refine(
      (type) => ACCEPTED_IMAGE_TYPES.includes(type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  size: z.number().max(MAX_FILE_SIZE, "Max file size is 5MB.")
})

export const LoginSchema = z.object({
  email: z
    .string("The email is required")
    .email("Invalid email address")
    .min(10, "Email must be at least 10 characters long"),
  password: z
    .string("The password is required")
    .min(6, "Password must be at least 6 characters long")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
      "Password must contain at least one letter and one number"
    )
})

export const ResetPasswordSchema = z
  .object({
    password: z
      .string({ message: "The password is required" })
      .min(6, "Password must be at least 6 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
        "Password must contain at least one letter and one number"
      ),
    confirmPassword: z.string({
      message: "Confirm password is required"
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })

export const EditProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
      "Password must contain at least one letter and one number"
    )
    .optional()
    .or(z.literal(""))
})

// Validates numeric IDs received from route params, query params, or request bodies, such as `/reviews/10`.
export const idSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER)

export const createReviewSchema = z.object({
  trip_id: idSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(5000)
})

export const replySchema = z.object({
  reviewId: idSchema,
  comment: z.string().trim().min(1).max(5000),
  replyToId: idSchema.nullable().optional()
})

export const replyUpdateSchema = z.object({
  comment: z.string().trim().min(1).max(5000)
})

export const ticketIdSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER)

export const webSocketMessageSchema = z.discriminatedUnion("event", [
  z
    .object({
      event: z.literal("join_ticket"),
      data: z.object({ ticketId: ticketIdSchema }).strict()
    })
    .strict(),
  z
    .object({
      event: z.literal("send_message"),
      data: z
        .object({
          ticketId: ticketIdSchema,
          content: z.string().trim().min(1).max(5000)
        })
        .strict()
    })
    .strict()
])

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>

const ticketMessageSchema = z
  .object({
    id: idSchema,
    ticket_id: idSchema,
    user: z
      .object({
        id: idSchema,
        name: z.string(),
        email: z.string()
      })
      .strict(),
    content: z.string(),
    createdAt: z.string()
  })
  .strict()

export const webSocketServerMessageSchema = z.discriminatedUnion(
  "event",
  [
    z.object({ event: z.literal("authenticated") }).strict(),
    z
      .object({
        event: z.literal("joined_ticket"),
        data: z.object({ message: z.string() }).strict()
      })
      .strict(),
    z
      .object({
        event: z.literal("receive_message"),
        data: ticketMessageSchema
      })
      .strict(),
    z
      .object({
        event: z.literal("ticket_history"),
        data: z
          .object({
            ticketId: ticketIdSchema,
            messages: z.array(ticketMessageSchema)
          })
          .strict()
      })
      .strict(),
    z
      .object({
        event: z.literal("error"),
        data: z.object({ message: z.string() }).strict()
      })
      .strict()
  ]
)

export type WebSocketServerMessage = z.infer<
  typeof webSocketServerMessageSchema
>

export const chatBodySchema = z.object({
  prompt: z
    .string({
      message: "The prompt must be a string."
    })
    .min(3, "Prompt too short (minimum 3 characters).")
    .max(2000, "Prompt too long (maximum 2000 characters).")
    .trim()
})
export type ChatRequestBody = z.infer<typeof chatBodySchema>
