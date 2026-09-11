import type { UpdateProfileInput } from "~/types/auth-types"
import { type PrismaClient } from "../../generated/prisma/client"
import { UnauthorizedError } from "./auth/custom-errors"
import type { PasswordHasher } from "./auth/security-helpers"
export class ProfileService {
  private prisma: PrismaClient
  private hasher: PasswordHasher
  constructor(prisma: PrismaClient, hasher: PasswordHasher) {
    this.prisma = prisma
    this.hasher = hasher
  }
  async findUserInfo(userId: number) {
    let userFound = await this.prisma.user.findUnique({
      where: { id: userId }
    })
    if (!userFound) {
      throw new UnauthorizedError("Invalid request!")
    }
    let existingData = {
      name: userFound.name,
      email: userFound.email,
      avatar: userFound.avatar_url as string
    }
    return existingData
  }
  async updateProfile(userId: string, input: UpdateProfileInput) {
    let userFound = await this.prisma.user.findUnique({
      where: { id: Number(userId) }
    })
    if (!userFound) {
      throw new UnauthorizedError("Invalid request!")
    }
    const updatedData: Record<string, string | boolean> = {}
    if (input.username) {
      updatedData.name = input.username
    }
    if (input.email && input.email !== userFound.email) {
      updatedData.email = input.email
      updatedData.is_verified = false
    }
    if (input.password && input.password.trim() !== "") {
      updatedData.password = await this.hasher.hash(input.password)
    }

    if (input.avatarFile) {
      updatedData.avatar_url = input.avatarFile
    }
    if (Object.keys(updatedData).length === 0) {
      return {
        id: userFound.id,
        name: userFound.name,
        email: userFound.email,
        avatar_url: userFound.avatar_url,
        is_verified: userFound.is_verified
      }
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: Number(userId) },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        is_verified: true
      }
    })
    return updatedUser
  }
}
