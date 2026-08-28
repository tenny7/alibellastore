"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStoreName } from "@/lib/hooks/use-site-settings";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const storeName = useStoreName();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const value = email.trim();
    if (!value) {
      setErrors({ email: "Enter the email address on your account" });
      return;
    }
    // Accounts created with a phone number have a synthetic @phone.local
    // address with no real inbox, so an email reset can never reach them.
    if (/^\+?[0-9\s]{9,15}$/.test(value) || value.endsWith("@phone.local")) {
      setErrors({
        email:
          "This looks like a phone number. Phone accounts have no email inbox — please contact support to reset your password.",
      });
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    // Always report success: confirming whether an address exists would let
    // anyone enumerate accounts.
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md p-6 lg:p-8">
        <div className="text-center">
          <MailCheck className="mx-auto h-10 w-10 text-surface-fg" strokeWidth={1.6} />
          <h1 className="font-display tracking-[-0.03em] mt-4 text-2xl font-bold text-surface-fg">
            Check your email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-surface-muted">
            If an account exists for <span className="font-medium text-surface-fg">{email}</span>,
            we&apos;ve sent a link to reset your password. It expires in one hour.
          </p>
          <p className="mt-4 text-xs text-surface-muted">
            Nothing arrived? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-medium text-surface-fg underline"
            >
              try another address
            </button>
            .
          </p>
          <Link href="/login" className="mt-6 block text-sm font-medium text-surface-fg underline">
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6 lg:p-8">
      <div className="mb-6 text-center">
        <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg">
          {storeName}
        </h1>
        <p className="mt-1 text-sm text-surface-muted">Reset your password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-surface-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-surface-fg underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
