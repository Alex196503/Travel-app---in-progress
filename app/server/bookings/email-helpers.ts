import sendEmailNotification from "~/nodemailer-config"

//Abstract class representing an email service provider. Implements the Dependency Inversion Principle, decoupling business logic from specific email vendors.
export abstract class IEmailService {
  abstract sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<void>
}

// Concrete implementation of the IEmailService using Nodemailer. Acts as an adapter wrapping the underlying email notification utili
export class NodemailerService extends IEmailService {
  async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    await sendEmailNotification(to, subject, body)
  }
}
