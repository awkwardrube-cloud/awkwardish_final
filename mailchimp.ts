export async function addSubscriberToAudience({
  email,
  firstName,
  apiKey,
  listId,
}: {
  email: string;
  firstName?: string | null;
  apiKey: string;
  listId: string;
}): Promise<{ status: string; message: string }> {
  const dc = apiKey.split("-").pop() ?? "us1";
  const base = `https://${dc}.api.mailchimp.com/3.0`;

  const body: Record<string, unknown> = {
    email_address: email,
    status: "subscribed",
  };

  if (firstName) {
    body.merge_fields = { FNAME: firstName };
  }

  const basicAuth = Buffer.from(`anystring:${apiKey}`).toString("base64");

  const res = await fetch(`${base}/lists/${listId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    status?: string | number;
    title?: string;
    detail?: string;
  };

  if (!res.ok) {
    const alreadySubscribed =
      data.title === "Member Exists" ||
      (data.detail ?? "").toLowerCase().includes("already a list member");

    if (alreadySubscribed) {
      return {
        status: "already_subscribed",
        message: "You're already on the list — we love you for being here!",
      };
    }

    throw new Error(data.detail ?? data.title ?? "Mailchimp error");
  }

  return { status: "subscribed", message: "You're in. Welcome to the cozy corner. ✿" };
}
