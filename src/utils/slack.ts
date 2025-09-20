import axios, { AxiosError } from "axios";
import { env } from "env";
async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 *
 * @param message
 * @param slackUrl By default it assumes that the message is for the backend slack channel
 * @returns
 */
export async function notifySlack(
  message: string,
  slackUrl: string = env.SLACK_BACKEND_WEBHOOK_URL
) {
  if (env.IN_TEST_MODE) return;
  console.log("Sending message to slack:", message);
  try {
    await axios.post(
      slackUrl,
      { text: `\`[${env.SLACK_MESSAGE_PREFIX}]\` ${message}` },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      `Error sending Slack message "${message.replaceAll(
        "\n",
        "[newline]"
      )}" to Slack:`,
      String(error)
    );
    if (error instanceof AxiosError) {
      if (error.status === 429) {
        // rate limited (we still want to send the message eventually)
        await wait(30 * 1000);
        await notifySlack(message, slackUrl);
      }
    }
  }
}
