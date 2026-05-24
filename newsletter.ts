import { Router, type IRouter } from "express";
import { SubscribeNewsletterBody } from "@workspace/api-zod";
import { addSubscriberToAudience } from "../lib/mailchimp";

const router: IRouter = Router();

router.post("/newsletter/subscribe", async (req, res) => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ detail: "Invalid request — please provide a valid email." });
    return;
  }

  const { email, first_name } = parsed.data;

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!apiKey || !listId) {
    req.log.warn("Mailchimp not configured — MAILCHIMP_API_KEY or MAILCHIMP_LIST_ID missing");
    res.status(500).json({ detail: "Newsletter is not configured yet. Check back soon!" });
    return;
  }

  try {
    const result = await addSubscriberToAudience({
      email,
      firstName: first_name ?? null,
      apiKey,
      listId,
    });
    res.json({ message: result.message, status: result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    req.log.error({ err }, "Mailchimp subscribe failed");
    res.status(500).json({ detail: message });
  }
});

export default router;
