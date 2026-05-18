import {
  buildAnalyticsPayload,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from "./events";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

function getCaptureUrl() {
  return `${posthogHost.replace(/\/$/, "")}/capture/`;
}

export async function captureServerAnalyticsEvent(input: {
  distinctId: string | null | undefined;
  event: AnalyticsEventName;
  properties?: AnalyticsProperties;
}) {
  if (!posthogKey || !input.distinctId) return;

  try {
    const response = await fetch(getCaptureUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildAnalyticsPayload({
          apiKey: posthogKey,
          distinctId: input.distinctId,
          event: input.event,
          properties: input.properties,
        })
      ),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("PostHog capture failed", {
        event: input.event,
        status: response.status,
      });
    }
  } catch (error) {
    console.warn("PostHog capture failed", {
      event: input.event,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getSubscriptionAnalyticsProperties(_userId: string) {
  return {
    plan: 'pro' as const,
    is_pro: true,
    subscription_status: 'active' as const,
  };
}
