"use client";

import { Toaster } from "sonner";

export default function Providers() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
    />
  );
}