import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Password reset email for ${to} was not sent.`);
      return false;
    }

    const from = this.configService.get<string>("MAIL_FROM") ?? "no-reply@localhost";

    await transporter.sendMail({
      from,
      to,
      subject: "Reset your password",
      text: [
        "We received a request to reset your password.",
        "",
        `Open this link to set a new password: ${resetUrl}`,
        "",
        "This link expires in 30 minutes.",
        "If you did not request this reset, you can ignore this email.",
      ].join("\n"),
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Open this link to set a new password</a></p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      `,
    });

    return true;
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>("SMTP_HOST");
    const portRaw = this.configService.get<string>("SMTP_PORT");

    if (!host || !portRaw) {
      return null;
    }

    const port = Number(portRaw);
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const secure = String(this.configService.get<string>("SMTP_SECURE") ?? "false") === "true";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }
}
