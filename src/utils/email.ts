import { env } from "env";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail", // Shortcut for Gmail's SMTP settings - see Well-Known Services
  auth: {
    type: "OAuth2",
    user: "ops@scottylabs.org",
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
  },
});
export async function sendEmail(
  to: string,
  cc: string,
  title: string,
  body: string,
) {
  const info = await transporter.sendMail({
    from: "",
    to: to.split(","),
    cc: cc.split(","),
    subject: title,
    text: body, // Plain-text version of the message
    html: body.replaceAll("\n", "<br/>"), // HTML version of the message
  });
  return info.accepted;
}
