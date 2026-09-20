"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CultBackdrop } from "@/components/CultBackdrop";
import { SiteNav } from "@/components/SiteNav";
import { cn } from "@/lib/utils";

const FlyBrain3D = dynamic(() => import("@/components/FlyBrain3D"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[18rem] items-center justify-center rounded-2xl bg-black/50 text-sm text-ink-400 ring-1 ring-white/10">
      Chargement du cerveau…
    </div>
  ),
});

type SectionId = "cnn" | "fly";

function Say({ children }: { children: string }) {
  return (
    <p className="mt-3 max-w-3xl border-l-2 border-lime pl-3 text-[1.05rem] leading-snug text-ink-50">
      <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime">
        Dire
      </span>
      {children}
    </p>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <span className="font-display text-2xl leading-none text-lime">{n}</span>
      <div className="min-w-0">
        <p className="font-display text-lg italic text-ink-50">{title}</p>
        <p className="mt-1 text-sm leading-snug text-ink-300">{body}</p>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-wider text-lime">{k}</p>
      <p className="mt-1 font-display text-lg italic leading-snug text-ink-50">{v}</p>
    </div>
  );
}

export function Docs() {
  const [section, setSection] = useState<SectionId>("cnn");

  useEffect(() => {
    const apply = () => {
      if (window.location.hash === "#fly") setSection("fly");
      if (window.location.hash === "#cnn") setSection("cnn");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function go(next: SectionId) {
    setSection(next);
    window.history.replaceState(null, "", next === "fly" ? "#fly" : "#cnn");
  }

  return (
    <div className="relative min-h-dvh text-ink-50">
      <CultBackdrop variant={section === "fly" ? "lime" : "default"} />
      <SiteNav eyebrow="Documentation" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
          À lire comme les diapos
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight italic sm:text-5xl">
          Comment ça pense
        </h1>
        <p className="mt-3 max-w-2xl text-ink-300">
          Même voix que le talk. D'abord le CNN — MTCNN, FaceNet, les 512
          nombres. Ensuite la mouche — un vrai câblage FlyWire qui vote en
          parallèle.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => go("cnn")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
              section === "cnn"
                ? "bg-lime text-ink-950"
                : "border border-white/15 bg-white/5 text-ink-200 hover:bg-white/10",
            )}
          >
            1 · CNN · FaceNet
          </button>
          <button
            type="button"
            onClick={() => go("fly")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
              section === "fly"
                ? "bg-lime text-ink-950"
                : "border border-white/15 bg-white/5 text-ink-200 hover:bg-white/10",
            )}
          >
            2 · Cerveau de mouche
          </button>
        </div>

        {section === "cnn" ? <CnnDocs /> : <FlyDocs />}
      </main>
    </div>
  );
}

function CnnDocs() {
  return (
    <div className="mt-10 space-y-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
          Le CNN
        </p>
        <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">
          On n'a pas appris à un ordinateur à voir
        </h2>
        <Say>
          Reconnaître un visage, c'est déjà résolu. On a emprunté cette
          compétence, puis on lui a montré qui est Hennen — une seule fois.
        </Say>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Fact k="Pas ça" v="Construire une IA visage de zéro" />
        <Fact k="Ça" v="Emprunter FaceNet, geler, apprendre une personne" />
        <Fact k="Sortie" v="HENNEN ou PAS HENNEN" />
      </div>

      <section>
        <h3 className="font-display text-2xl italic">CNN, en une phrase</h3>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-200">
          Convolutional neural net = un réseau qui ne lit pas la photo d'un
          coup. Il glisse de{" "}
          <span className="text-lime">petits carrés</span> sur les pixels.
          Le premier carré cherche un bord. Le suivant assemble un œil. Plus
          loin, un visage. FaceNet, c'est ça — un Inception-ResNet déjà
          entraîné sur ~3,3 millions de visages. On le{" "}
          <span className="text-lime">gèle</span>. On ne touche plus à ces
          millions de poids.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-300">
          Notre job est minuscule : une couche 512 → 64 → 2, plus l'empreinte
          moyenne de Hennen, dans un fichier de 176 Ko. Les nouvelles photos
          ne réécrivent rien. C'est une passe avant. Pas un cours.
        </p>
      </section>

      <section>
        <h3 className="font-display text-2xl italic">MTCNN trouve la tête</h3>
        <Say>
          Une photo n'est pas un visage. Boutons, piscine, foule, jeu — tout
          ça, on jette. Il reste un carré de 160 pixels.
        </Say>
        <div className="mt-5 grid gap-2">
          <Step
            n="P"
            title="Proposal Net"
            body="Un tout petit filet balaye l'image à plusieurs échelles et dit : « là, peut-être une tête »."
          />
          <Step
            n="R"
            title="Refine Net"
            body="Il jette les fausses pistes. La boîte se resserre. Deuxième opinion."
          />
          <Step
            n="O"
            title="Output Net"
            body="Dernier passage : les coins des yeux, le nez, la bouche. On recadre, on aligne, on envoie à FaceNet."
          />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-400">
          Si MTCNN ne voit personne, l'appli s'arrête :{" "}
          <span className="text-coral">PAS DE VISAGE</span>. Pas d'empreinte
          fantôme. Pas de vote de la mouche non plus.
        </p>
      </section>

      <section>
        <h3 className="font-display text-2xl italic">FaceNet écrit 512 nombres</h3>
        <Say>
          Même personne → nombres proches. Autre personne → nombres
          différents. On n'enregistre pas la photo. On enregistre une
          empreinte.
        </Say>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-200">
          Derrière le recadrage, des couches de convolution s'empilent. La
          première (conv1) est celle que le détecteur dessine en live : des
          cartes d'activation, des taches claires là où le filtre a vu un
          contraste. Plus profond, ce n'est plus du pixel. C'est une
          géométrie du visage — un point dans un espace à{" "}
          <span className="text-lime">512 dimensions</span>.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-300">
          On a fait la moyenne des empreintes des photos de Hennen. C'est le{" "}
          <span className="text-lime">prototype</span>. Une nouvelle photo,
          on mesure l'angle avec ce prototype : similarité{" "}
          <span className="text-lime">cosinus</span>. 1,0 = identique. 0 =
          rien à voir.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-lime/15 px-4 py-3 ring-1 ring-lime/40">
            <p className="text-[11px] uppercase tracking-wider text-lime">Règle de sécurité</p>
            <p className="mt-1 text-sm leading-snug text-ink-50">
              Sous ~0,61 de cosinus, c'est PAS Hennen. Point. Le petit réseau
              64 neurones n'a pas le droit de nous convaincre du contraire.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-wider text-ink-400">Pourquoi</p>
            <p className="mt-1 text-sm leading-snug text-ink-300">
              Un inconnu a un jour marqué 57 % Hennen parce que l'add-on était
              trop sûr. Son empreinte n'était qu'à 0,30. Depuis, l'empreinte
              gagne.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-display text-2xl italic">Ce qui arrive à une photo</h3>
        <div className="mt-5 grid gap-2">
          <Step
            n="1"
            title="Trouver le visage"
            body="MTCNN parcourt, propose, raffine, recadre."
          />
          <Step
            n="2"
            title="Empreinte"
            body="FaceNet gelé écrit 512 nombres. Un flip horizontal, on moyenne — plus stable."
          />
          <Step
            n="3"
            title="Comparer"
            body="Cosinus contre le prototype Hennen. Plus c'est proche de 1, plus c'est lui."
          />
          <Step
            n="4"
            title="Petite tête"
            body="512 → 64 → 2. Un avis en plus. Il ne peut pas contrer un miss de cosinus."
          />
          <Step
            n="5"
            title="Réponse"
            body="HENNEN ou PAS HENNEN. L'image live plus bas n'est qu'un film de ces étapes."
          />
        </div>
        <p className="mt-5 text-sm text-ink-400">
          L'écran avec les fils, c'est de la visualisation. Aucun
          apprentissage en cours. Rafraîchir la page n'entraîne rien.
        </p>
      </section>

      <Link
        href="/detect"
        className="inline-flex rounded-lg bg-lime px-4 py-2 font-display italic text-ink-950"
      >
        Tester une photo
      </Link>
    </div>
  );
}

function FlyDocs() {
  return (
    <div className="mt-10 space-y-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mint">
          La mouche
        </p>
        <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">
          La mouche ne le voit pas. Elle le sent.
        </h2>
        <Say>
          Même photo. Même question. Deuxième vote. Le nez est FaceNet. Le
          champignon, c'est le vrai câblage d'une drosophile.
        </Say>
        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-ink-400">
          Câblage : mouche réelle · Nez : FaceNet
        </p>
      </header>

      <FlyBrain3D className="h-[min(52vh,28rem)]" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Fact k="Mesuré" v="139 255 somas FlyWire, synapses PN → KC → MBON" />
        <Fact k="Inventé" v="L'odeur = l'empreinte FaceNet. La mouche n'a jamais vu Hennen." />
        <Fact k="Gelé" v="Sucre / choc une fois. Détecter ne réapprend jamais." />
      </div>

      <section>
        <h3 className="font-display text-2xl italic">C'est un vrai cerveau. Pas un dessin.</h3>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-200">
          FlyWire a tranché une mouche femelle adulte, neuron par neuron.
          Version FAFB v783 :{" "}
          <span className="text-lime">139 255 cellules</span>, positions 3D
          des corps cellulaires. Le nuage que vous voyez, c'est ça. Optique
          un peu menthe. Le reste, encre. Quand on scanne, on n'allume pas
          « le cerveau au hasard ». On allume les{" "}
          <span className="text-lime">vrais</span> neurones du corps
          pédonculé qui viennent de tirer.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-400">
          Dorkenwald et al., Nature 634, 124–138 (2024). CC BY-NC 4.0. On n'a
          pas collé des IDs d'un autre cerveau sur ce nuage.
        </p>
      </section>

      <section>
        <h3 className="font-display text-2xl italic">Le champignon, mode d'emploi</h3>
        <Say>
          Chez la mouche, une odeur n'est pas une image. C'est un motif
          clairsemé de cellules de Kenyon. On a menti un peu : l'odeur, ici,
          c'est un visage.
        </Say>
        <div className="mt-5 grid gap-2">
          <Step
            n="PN"
            title="Projection neurons"
            body="691 cellules. Chez la mouche elles portent l'odeur depuis l'antenne. Chez nous, les 512 nombres FaceNet sont projetés dessus — carte figée, graine fixe. Auteur : nous. Biologie : non."
          />
          <Step
            n="KC"
            title="Kenyon, k-winners-take-all"
            body="1 200 cellules gardées, connectées comme dans le connectome. ~6 % seulement restent allumées. C'est le feu d'artifice sparse. C'est ça que le 3D montre."
          />
          <Step
            n="MBON"
            title="Sortie + valence"
            body="96 neurones de sortie. Le signe « approche / évite » vient des synapses dopamine (PAM sucre, PPL1 choc) mesurées sur la même mouche."
          />
        </div>
      </section>

      <section>
        <h3 className="font-display text-2xl italic">Sucre une fois. Choc une fois.</h3>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-200">
          On a présenté les empreintes Hennen avec une récompense (sucre).
          Les autres visages avec une punition (choc). Les gains KC → MBON
          se dépriment à la dopamine, comme dans le modèle fly-blackjack
          (MIT). Puis on sauve le fichier. Au détecteur,{" "}
          <span className="text-lime">on ne retraine plus</span>.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-300">
          Si la valence dépasse le seuil appris, la mouche dit HENNEN. Sinon
          PAS HENNEN. Deux badges. Le CNN peut dire non et la mouche oui —
          ce n'est pas un bug de costume, c'est un deuxième classificateur,
          plus naïf, sur le même nez.
        </p>
      </section>

      <section>
        <h3 className="font-display text-2xl italic">Ce que ça n'est pas</h3>
        <ul className="mt-4 space-y-2 text-ink-300">
          <li>
            <span className="text-coral">Pas</span> une mouche vivante uploadée.
          </li>
          <li>
            <span className="text-coral">Pas</span> Doom, pas le blackjack, pas
            un Among Us meeting. Among Us, c'est juste le badge NON des diapos.
          </li>
          <li>
            <span className="text-lime">Oui</span> : câblage biologique,
            dynamique modèle, capteur FaceNet. On le dit, comme DesktopFly.
          </li>
        </ul>
      </section>

      <Link
        href="/detect"
        className="inline-flex rounded-lg bg-lime px-4 py-2 font-display italic text-ink-950"
      >
        Voir le nuage sur une photo
      </Link>
    </div>
  );
}
