"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStoreName } from "@/lib/hooks/use-site-settings";
import toast from "react-hot-toast";

/** Reached from the emailed link, after /api/auth/callback has exchanged the
 *  recovery code for a session. Without that session there is nothing to
 *  update, so we check for one before showing the form. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const storeName = useStoreName();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!active) return;
        setHasSession(Boolean(data.user));
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }

    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    router.push("/");
    router.refresh();
  }

  if (checking) {
    return (
      <Card className="w-full max-w-md p-6 lg:p-8">
        <p className="text-center text-sm text-surface-muted">Checking your link…</p>
      </Card>
    );
  }

  if (!hasSession) {
    return (
      <Card className="w-full max-w-md p-6 lg:p-8">
        <div className="text-center">
          <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg">
            Link expired
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-surface-muted">
            This reset link is no longer valid. Reset links can only be used once and expire after
            an hour.
          </p>
          <Link href="/forgot-password" className="mt-6 inline-block">
            <Button size="lg">Request a new link</Button>
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
        <p className="mt-1 text-sm text-surface-muted">Choose a new password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="password"
          type="password"
          label="New password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          id="confirm"
          type="password"
          label="Confirm new password"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Update password
        </Button>
      </form>
    </Card>
  );
}
