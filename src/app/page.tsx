import { Suspense } from "react";
import { Presentation } from "@/components/Presentation";

export default function Home() {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#070708]" />}>
      <Presentation />
    </Suspense>
  );
}
