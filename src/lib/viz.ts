export type VizEdge = { s: number; d: number; w: number };

export type ConvMaps = { c: number; s: number; px: number[] };

export type VizPayload = {
  seq: number;
  input: number[];
  hidden: number[];
  output: number[];
  e1: VizEdge[];
  e2: VizEdge[];
  loss: number | null;
  epoch: number | null;
  epochs: number | null;
  phase: string;
  title: string;
  subtitle: string;
  maps?: ConvMaps | null;
  face?: string | null;
};

export const IDLE_VIZ: VizPayload = {
  seq: 0,
  input: Array.from({ length: 512 }, () => 0),
  hidden: Array.from({ length: 64 }, () => 0),
  output: [0.5, 0.5],
  e1: [],
  e2: [],
  loss: null,
  epoch: null,
  epochs: null,
  phase: "idle",
  title: "C'est Hennen ?",
  subtitle: "en attente d'une passe avant",
  maps: null,
  face: null,
};
