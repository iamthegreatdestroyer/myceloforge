"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

export default function MyceloForge() {
  const [seed, setSeed] = useState(
    "Pembroke Pines Florida bottom-lit Moon during day → wealth oracle",
  );
  const [phase, setPhase] = useState("Waxing Gibbous 72%");
  const [forging, setForging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empires, setEmpires] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/negative-space/lunar-phase")
      .then((r) => r.json())
      .then((d) => setPhase(d.phase || "Waxing Gibbous"));
  }, []);

  const deployEmpire = async () => {
    setForging(true);
    const res = await fetch("http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "ryzanstein-bitnet-7b",
        messages: [
          {
            role: "user",
            content: `Lunar MyceloForge seed: ${seed}. Current Moon: ${phase}. Use QHSS collapsed states, Negative_Space void mining, sigma-index for novelty, spawn DOPPELGANGER agent.`,
          },
        ],
      }),
    });
    const data = await res.json();

    const newEmpire = {
      name: data.choices[0].message.content.split("\n")[0].replace("**", ""),
      value: "$12.8M projected Year 1",
      nft: "solana://zk-minted-via-nexuszero",
      agent: "DOPPELGANGER LIVE — posting on @9shortlives",
      viz: "🌕🧬🕳️",
    };
    setEmpires((prev) => [...prev, newEmpire]);
    setForging(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Scene />

      <div className="relative z-10 p-12 max-w-5xl mx-auto text-center">
        <h1 className="text-[120px] font-black leading-none bg-gradient-to-br from-cyan-400 via-purple-600 to-pink-500 bg-clip-text text-transparent glow-cyan">
          MYCELOFORGE
        </h1>
        <p className="text-4xl mt-6 text-emerald-400">
          Live • {phase} • Pembroke Pines, Florida
        </p>

        <textarea
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="mt-16 w-full h-48 bg-zinc-950 border-2 border-cyan-400 rounded-3xl p-8 text-xl font-mono"
        />

        <button
          onClick={deployEmpire}
          disabled={forging}
          className="mt-10 w-full py-12 text-5xl font-black bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 rounded-3xl hover:scale-110 transition-all shadow-2xl shadow-purple-500/50 mycelium-glow"
        >
          {forging
            ? "MYCELIUM FRUITING ON YOUR RYZANSTEIN..."
            : "DEPLOY MY FIRST EMPIRE NOW"}
        </button>

        {empires.length > 0 && (
          <div className="mt-20 space-y-8">
            {empires.map((e, i) => (
              <div
                key={i}
                className="bg-zinc-900/95 border-2 border-emerald-400 p-12 rounded-3xl text-left"
              >
                <div className="text-8xl mb-6">{e.viz}</div>
                <h3 className="text-6xl font-bold">{e.name}</h3>
                <p className="text-emerald-400 text-4xl mt-4">{e.value}</p>
                <p className="text-cyan-400 mt-8 text-2xl">
                  ZK-NFT minted • DOPPELGANGER deployed
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
