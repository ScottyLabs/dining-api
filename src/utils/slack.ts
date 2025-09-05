import axios, { AxiosError } from "axios";
import { env } from "env";
async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function notifySlack(message: string) {
  if (env.IN_TEST_MODE) {
    console.log("would've notified slack with message", message);
    return;
  }
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
        await wait(30 * 1000);
        await notifySlack(message);
      }
    }
  }
}
