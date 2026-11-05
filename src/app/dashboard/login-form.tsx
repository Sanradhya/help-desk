"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("Login was rejected.");
        return;
      }
      setPassword("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md rounded-2xl border border-line bg-card p-6 sm:p-8"
    >
      <label htmlFor="password" className="block text-sm font-medium">
        Admin password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none transition focus:border-copper"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-copper disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {error ? <p className="text-copper">{error}</p> : null}
      </div>
    </form>
  );
}
