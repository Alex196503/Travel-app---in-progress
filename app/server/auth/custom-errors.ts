// Error class for handling bad requests ->(HTTP status 400)
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BadRequestError"
  }
}

// Error class for handling Unauthorized requests ->(HTTP status 401)
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnauthorizedError"
  }
}

// Error class for handling not found errors ->(HTTP status 403)
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ForbiddenError"
  }
}

// Error class for handling not found errors ->(HTTP status 404)
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

// Error class for handling request conflits ->(HTTP status 409)
export class Conflict extends Error {
  constructor(message: string) {
    super(message)
    this.name = "Conflict"
  }
}
