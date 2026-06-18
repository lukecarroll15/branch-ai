"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-2xl bg-primary px-8 py-4 text-center text-lg font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
