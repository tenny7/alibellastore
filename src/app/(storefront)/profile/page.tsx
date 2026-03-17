"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Package } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email || "");
      const meta = user.user_metadata;
      setName(meta?.name || "");
      setPhone(meta?.phone || user.phone || "");
      setAddress(meta?.address || "");
      setLoading(false);
    });
  }, [router]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: { name, phone, address },
    });

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">My Profile</h1>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Package className="h-4 w-4" />
          My Orders
        </Link>
      </div>

      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-[#1E293B]">{name || "Customer"}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <Input
          id="name"
          label="Full Name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          id="email"
          label="Email"
          value={email}
          disabled
          onChange={() => {}}
        />

        <Input
          id="phone"
          label="Phone Number"
          placeholder="+250780000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Textarea
          id="address"
          label="Default Delivery Address"
          placeholder="Enter your delivery address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <Button
          onClick={handleSave}
          loading={saving}
          className="w-full"
          size="lg"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
