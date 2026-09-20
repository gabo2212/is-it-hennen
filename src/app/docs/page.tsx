import { Docs } from "@/components/Docs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs · C'est Hennen ?",
  description:
    "Comment FaceNet, MTCNN et le CNN votent HENNEN, et comment le cerveau de mouche FlyWire vote en parallèle.",
};

export default function DocsPage() {
  return <Docs />;
}
