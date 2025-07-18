import axios, { AxiosError } from "axios";
import { env } from "env";

export async function notifySlack(message: string) {
  if (env.IN_TEST_MODE) return;
  console.log("Sending message to slack:", message);
  try {
    await axios.post(
      env.SLACK_WEBHOOK_URL,
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
        setTimeout(() => {
          notifySlack(message);
        }, 30000);
      }
    }
  }
}
