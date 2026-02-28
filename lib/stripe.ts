import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.warn("Stripe publishable key not configured");
}

export async function getStripe() {
  return stripePromise;
}

export interface CheckoutSession {
  empireId: string;
  empireName: string;
  amount: number; // in cents
  userId: string;
}

export async function createCheckoutSession(
  session: CheckoutSession
): Promise<string | null> {
  try {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return null;
  }
}

export async function redirectToCheckout(sessionId: string) {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  // Modern Stripe.js uses window.location redirect
  window.location.href = `/api/stripe/redirect?sessionId=${sessionId}`;
}
