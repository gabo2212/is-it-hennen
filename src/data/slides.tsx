import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Slide = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  /** Une phrase à lire à voix haute. Affichée sur la diapo. */
  say?: string;
  content: ReactNode;
  tone?: "hero" | "dark" | "accent" | "demo";
};

function PicSlot({
  label,
  hint,
  src,
  badge,
  badgeTone = "yes",
  fit = "contain",
  focus = "center",
  hideCaption = false,
  className,
}: {
  label: string;
  hint?: string;
  src?: string;
  badge?: string;
  badgeTone?: "yes" | "no" | "train";
  fit?: "cover" | "contain";
  focus?: "center" | "left" | "bottom" | "left-bottom";
  hideCaption?: boolean;
  className?: string;
}) {
  const badgeClass =
    badgeTone === "yes"
      ? "bg-lime text-ink-950"
      : badgeTone === "no"
        ? "bg-coral text-ink-50"
        : "bg-white/15 text-ink-50";

  return (
    <figure
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl ring-1 ring-white/15",
        className,
      )}
    >
      <div className="relative min-h-0 flex-1 bg-ink-900">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            className={cn(
              "absolute inset-0 h-full w-full",
              fit === "contain" ? "object-contain object-center" : "object-cover",
              fit === "cover" && focus === "left" && "object-left",
              fit === "cover" && focus === "bottom" && "object-bottom",
              fit === "cover" && focus === "left-bottom" && "object-left-bottom",
              fit === "cover" && focus === "center" && "object-center",
            )}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-lime/35 px-3 text-center">
            <span className="font-display text-sm text-lime">Ajouter une photo</span>
            <span className="max-w-[10rem] text-[11px] leading-snug text-ink-400">
              {hint ?? "data/hennen/"}
            </span>
          </div>
        )}
        {badge && (
          <span
            className={`absolute top-2 right-2 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {badge}
          </span>
        )}
      </div>
      {!hideCaption && (
        <figcaption className="shrink-0 bg-black/35 px-3 py-1.5 text-center text-xs text-ink-300">
          {label}
        </figcaption>
      )}
    </figure>
  );
}

function StackCard({ name, job }: { name: string; job: string }) {
  return (
    <div className="flex min-h-0 flex-col justify-start rounded-xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
      <p className="font-display text-[clamp(1.05rem,2.2vh,1.35rem)] text-lime">{name}</p>
      <p className="mt-1.5 text-[clamp(0.8rem,1.5vh,0.95rem)] leading-snug text-ink-300">{job}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex min-h-0 gap-3 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
      <span className="font-display text-[clamp(1.4rem,3vh,2rem)] leading-none text-lime">{n}</span>
      <div className="min-w-0">
        <p className="font-display text-[clamp(1rem,2vh,1.2rem)] text-ink-50">{title}</p>
        <p className="mt-0.5 text-[clamp(0.8rem,1.45vh,0.95rem)] leading-snug text-ink-300">{body}</p>
      </div>
    </div>
  );
}

export const slides: Slide[] = [
  {
    id: "title",
    section: "Mini-projet",
    title: "C'est Hennen ?",
    subtitle: "Une photo entre. Une réponse sort.",
    say: "Cette appli regarde une photo et répond à une seule question : c'est Hennen, ou pas ?",
    tone: "hero",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
          <PicSlot
            label="Dashcam, mèmes, métro…"
            src="/slides/hennen-dashcam.jpg"
            badge="22 photos"
            badgeTone="train"
          />
          <PicSlot
            label="Micro de rallye"
            src="/slides/hennen-mic.jpg"
            badge="OUI"
            badgeTone="yes"
          />
          <PicSlot
            label="Selfie piscine"
            src="/slides/hennen-pool.jpg"
            badge="OUI"
            badgeTone="yes"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <span className="rounded-md bg-white/10 px-2 py-1 text-lime">fichier mémoire · 176 Ko</span>
          <span className="rounded-md bg-white/10 px-2 py-1">appris une fois</span>
          <span className="rounded-md bg-white/10 px-2 py-1">n'apprend jamais sur les nouvelles photos</span>
          <a
            href="/docs"
            className="ml-auto inline-flex rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-display italic text-ink-50"
          >
            Docs
          </a>
          <a
            href="/detect"
            className="inline-flex rounded-lg bg-lime px-3 py-1.5 font-display italic text-ink-950"
          >
            Ouvrir le détecteur
          </a>
        </div>
      </div>
    ),
  },
  {
    id: "idea",
    section: "L'idée",
    title: "On n'a pas appris à un ordinateur à voir",
    say: "Reconnaître un visage, c'est déjà résolu. On a emprunté cette compétence, puis on lui a montré qui est Hennen — une seule fois.",
    content: (
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="space-y-3 text-[clamp(0.9rem,1.7vh,1.1rem)] leading-snug text-ink-200">
            <p>
              Entraîner un réseau à comprendre les visages depuis zéro demanderait
              des millions d'images et un énorme ordinateur. On a sauté ça.
            </p>
            <p>
              D'autres ont déjà entraîné un expert des visages,{" "}
              <span className="text-lime">FaceNet</span>, sur environ{" "}
              <span className="text-lime">3,3 millions de visages</span>. On
              télécharge ce cerveau et on le{" "}
              <span className="text-lime">gèle</span> — on ne touche plus à cette
              partie.
            </p>
            <p className="text-ink-300">
              Notre job est minuscule : lui montrer 22 photos de Hennen, sauver un
              fichier mémoire, puis seulement demander « lui, ou pas ? »
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <p className="text-[10px] uppercase tracking-wider text-coral">Pas ça</p>
              <p className="mt-0.5 font-display text-sm">Construire une IA visage de zéro</p>
            </div>
            <div className="rounded-xl bg-lime/15 px-3 py-2 ring-1 ring-lime/40">
              <p className="text-[10px] uppercase tracking-wider text-lime">Ça</p>
              <p className="mt-0.5 font-display text-sm">Emprunter un expert, lui apprendre une personne</p>
            </div>
            <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <p className="text-[10px] uppercase tracking-wider text-ink-400">Résultat</p>
              <p className="mt-0.5 font-display text-sm">HENNEN ou PAS HENNEN</p>
            </div>
          </div>
        </div>
        <div className="grid min-h-0 grid-rows-2 gap-3">
          <PicSlot label="Hennen" src="/slides/hennen-hoodie.jpg" badge="OUI" />
          <PicSlot label="Hennen" src="/slides/hennen-metro.jpg" badge="OUI" />
        </div>
      </div>
    ),
  },
  {
    id: "stack",
    section: "La stack",
    title: "Trois programmes, un seul job",
    say: "Le site affiche. Python fait le calcul. Un petit fichier, c'est la mémoire du visage de Hennen.",
    content: (
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-3">
        <StackCard
          name="Le site"
          job="Next.js — les diapos que vous voyez, et la page où on dépose une photo. Il ne fait pas le calcul du visage."
        />
        <PicSlot
          label="Une des 22"
          src="/slides/hennen-pool.jpg"
          badge="Hennen"
        />
        <StackCard
          name="Le cerveau"
          job="Python + FastAPI — trouve le visage, le transforme en nombres, compare à Hennen. C'est la partie CNN."
        />
          <PicSlot
            label="Le détecteur recadre ça"
            src="/slides/not-cafeteria.jpg"
            badge="MTCNN"
            badgeTone="train"
            focus="left"
          />
        <StackCard
          name="La mémoire"
          job="hennen.pt — un fichier de 176 Ko. Il contient l'empreinte moyenne de Hennen plus un tout petit réseau entraîné une fois."
        />
        <PicSlot
          label="FaceNet lit ça"
          src="/slides/hennen-close.jpg"
          badge="512 nombres"
          badgeTone="train"
        />
      </div>
    ),
  },
  {
    id: "flow",
    section: "Comment ça marche",
    title: "Ce qui arrive à une photo",
    say: "Trouver le visage. Le transformer en empreinte. Comparer à celle de Hennen. Puis dire oui ou non.",
    content: (
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid min-h-0 gap-2">
          <Step
            n="1"
            title="Trouver le visage"
            body="MTCNN parcourt la photo et découpe la tête. Boutons, piscine, foule, jeu — tout le reste est jeté."
          />
          <Step
            n="2"
            title="En faire une empreinte"
            body="FaceNet lit le recadrage et écrit 512 nombres. Même personne → nombres proches. Autre personne → nombres différents."
          />
          <Step
            n="3"
            title="Comparer à Hennen"
            body="On a déjà sauvé l'empreinte moyenne de Hennen à partir des 22 photos. On mesure à quel point celle-ci est proche (similarité cosinus)."
          />
          <Step
            n="4"
            title="La règle de sécurité"
            body="Si la correspondance est sous 0,61, ce n'est PAS Hennen. Point. Le petit réseau en plus n'a pas le droit de nous convaincre du contraire."
          />
          <Step
            n="5"
            title="Réponse"
            body="HENNEN ou PAS HENNEN. L'image live plus tard n'est qu'un film de ces étapes — ce n'est pas un entraînement."
          />
        </div>
        <div className="grid min-h-0 grid-rows-3 gap-2.5">
          <PicSlot label="1. Trouver ce visage" src="/slides/hennen-dashcam.jpg" badge="recadrage" badgeTone="train" />
          <PicSlot label="2. Empreinte" src="/slides/hennen-close.jpg" badge="512-d" badgeTone="train" />
          <PicSlot label="5. HENNEN" src="/slides/hennen-mic.jpg" badge="OUI" />
        </div>
      </div>
    ),
  },
  {
    id: "once",
    section: "Entraînement",
    title: "Apprendre une fois. Puis verrouiller.",
    say: "On lui a montré 22 photos de Hennen, on a lancé train une fois, et on a sauvé un fichier. Les nouvelles photos ne changent plus le modèle.",
    tone: "accent",
    content: (
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="space-y-3 text-[clamp(0.88rem,1.65vh,1.05rem)] leading-snug text-ink-200">
            <p>
              Un dossier de photos → une commande → un fichier. C'est toute
              l'histoire de l'entraînement.
            </p>
            <p>
              18 photos pour apprendre, 4 gardées comme test. Les photos test de
              Hennen sont toutes revenues <span className="text-lime">HENNEN (4/4)</span>.
              On lui a aussi montré 94 visages au hasard pour qu'il sache à quoi
              ressemble « pas lui ».
            </p>
            <p className="text-ink-300">
              Après ça, le détecteur ne fait que{" "}
              <span className="text-lime">charger</span> le fichier et une passe
              avant — comme chercher un nom, pas étudier.
            </p>
          </div>
          <ul className="grid min-h-0 grid-cols-2 gap-2 text-[clamp(0.8rem,1.45vh,0.95rem)]">
            {[
              ["22 photos", "vraies photos en vrac"],
              ["Train une fois", "→ hennen.pt"],
              ["176 Ko", "tient sur une clé USB"],
              ["Détecter n'entraîne jamais", "dépose une photo, stop"],
            ].map(([k, v]) => (
              <li key={k} className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <span className="text-lime">{k}</span>
                <span className="mt-0.5 block text-ink-300">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2.5">
          <PicSlot label="Train" src="/slides/hennen-hoodie.jpg" badge="OUI" />
          <PicSlot label="Train" src="/slides/hennen-metro.jpg" badge="OUI" />
          <PicSlot label="Train" src="/slides/hennen-pool.jpg" badge="OUI" />
          <PicSlot label="Test" src="/slides/hennen-mic.jpg" badge="4/4" badgeTone="train" />
        </div>
      </div>
    ),
  },
  {
    id: "data",
    section: "La mémoire",
    title: "L'empreinte de Hennen vs n'importe qui d'autre",
    say: "Vert, c'est Hennen. Rose, c'est un inconnu. Chaque visage devient 512 nombres. On garde la moyenne de Hennen.",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-2.5">
          <PicSlot label="Hennen" src="/slides/hennen-close.jpg" badge="OUI" badgeTone="yes" />
          <PicSlot label="Hennen" src="/slides/hennen-hoodie.jpg" badge="OUI" badgeTone="yes" />
          <PicSlot label="Among Us · labo" src="/slides/not-lab.jpg" badge="NON" badgeTone="no" focus="left" />
          <PicSlot label="Among Us · comms" src="/slides/not-comms.jpg" badge="NON" badgeTone="no" focus="left" />
          <PicSlot label="Hasard" src="/slides/not-longhair.jpg" badge="NON" badgeTone="no" />
          <PicSlot label="Hasard" src="/slides/not-bw.jpg" badge="NON" badgeTone="no" />
        </div>
        <p className="shrink-0 text-[clamp(0.8rem,1.45vh,0.95rem)] leading-snug text-ink-300">
          Pourquoi la règle de sécurité existe : un inconnu a un jour marqué 57 %
          Hennen parce que le petit add-on était trop sûr de lui. Son empreinte
          n'était qu'à 0,30 contre le seuil de 0,61 — donc maintenant l'empreinte
          gagne. Si ce n'est pas assez proche, on dit{" "}
          <span className="text-coral">PAS HENNEN</span>.
        </p>
      </div>
    ),
  },
  {
    id: "live",
    section: "Détecteur",
    title: "L'image live est un film, pas un prof",
    say: "Cet écran, c'est les cinq mêmes étapes dessinées en direct. De jolis fils. Aucun apprentissage en cours.",
    tone: "demo",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1">
          <PicSlot
            fit="contain"
            label="Recadrage → première couche FaceNet → empreinte 512 → 64 cachées → HENNEN 89 %"
            src="/slides/detect-live.jpg"
            badge="il regarde, il n'apprend pas"
            badgeTone="train"
          />
        </div>
        <p className="shrink-0 text-[clamp(0.8rem,1.4vh,0.9rem)] text-ink-400">
          Le site (Next.js) dessine ça. Python a déjà fini la réponse et envoyé
          les nombres. Rafraîchir la page n'entraîne rien.
        </p>
      </div>
    ),
  },
  {
    id: "close",
    section: "C'est tout",
    title: "Quoi retenir s'ils posent des questions",
    say: "On a emprunté un expert des visages. On lui a appris Hennen une fois. On a verrouillé le fichier. Maintenant il répond seulement lui, ou pas.",
    tone: "hero",
    content: (
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-3">
          <ol className="space-y-2.5 text-[clamp(0.9rem,1.7vh,1.1rem)] text-ink-200">
            <li>
              <span className="text-lime">1.</span> FaceNet connaît déjà les
              visages. On l'a gelé. On n'entraîne pas ce CNN-là.
            </li>
            <li>
              <span className="text-lime">2.</span> On a entraîné un tout petit
              add-on sur 22 photos en vrac et sauvé{" "}
              <span className="text-lime">hennen.pt</span> (176 Ko).
            </li>
            <li>
              <span className="text-lime">3.</span> Une nouvelle photo, c'est :
              trouver le visage → empreinte → comparer → HENNEN / PAS HENNEN.
            </li>
            <li>
              <span className="text-lime">4.</span> Si l'empreinte n'est pas assez
              proche, la réponse est non. L'add-on ne peut pas tricher.
            </li>
          </ol>
          <div className="rounded-xl bg-white/5 px-4 py-3 text-[clamp(0.8rem,1.45vh,0.95rem)] leading-snug text-ink-300 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-wider text-lime">Si quelqu'un demande « CNN ? »</p>
            <p className="mt-1 text-ink-50">
              Convolutional neural net = un réseau qui regarde les pixels par
              petits carrés. FaceNet, c'est ça. Le nôtre, c'est une copie gelée
              plus une toute petite couche en plus.
            </p>
          </div>
          <a
            href="/detect"
            className="inline-flex w-fit rounded-lg bg-lime px-4 py-2 font-display italic text-ink-950"
          >
            Tester une photo
          </a>
        </div>
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2.5">
          <PicSlot label="Hennen" src="/slides/hennen-dashcam.jpg" badge="OUI" />
          <PicSlot label="Hennen" src="/slides/hennen-close.jpg" badge="OUI" />
          <PicSlot label="Hennen" src="/slides/hennen-hoodie.jpg" badge="OUI" />
          <PicSlot label="Among Us · réacteur" src="/slides/not-reactor.jpg" badge="NON" badgeTone="no" focus="left-bottom" />
        </div>
      </div>
    ),
  },
];
