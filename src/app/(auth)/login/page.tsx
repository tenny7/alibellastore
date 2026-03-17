"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStoreName } from "@/lib/hooks/use-site-settings";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const storeName = useStoreName();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!identifier) {
      setErrors({ identifier: "Phone number or email is required" });
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }

    // Determine if the user entered a phone number or email
    const isPhone = /^\+?[0-9]{9,15}$/.test(identifier.replace(/\s/g, ""));
    const authEmail = isPhone
      ? `${identifier.replace(/[\s+]/g, "")}@phone.local`
      : identifier;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check user role to redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (dbUser?.role === "admin") {
        router.push("/admin");
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    }
  }

  return (
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">{storeName}</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
      </div>

      {searchParams.get("error") === "unauthorized" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#DC2626]">
          You need admin access for that page.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="identifier"
          label="Phone Number or Email"
          placeholder="+250780000000 or you@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          autoComplete="username"
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />
        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
