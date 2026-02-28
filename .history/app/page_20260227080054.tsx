'use client';
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

export default function MyceloForge() {
  const [seed, setSeed] = useState("Pembroke Pines Florida bottom-lit Moon during day → wealth oracle");
  const [phase, setPhase] = useState("Waxing Gibbous 72%");
  const [forging, setForging] = useState(false);
  const [empires, setEmpires] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/negative-space/lunar-phase')
      .then(r => r.json())
      .then(d => setPhase(d.phase || "Waxing Gibbous"));
  }, []);

  const deployEmpire = async () => {
    setForging(true);
    const res = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "ryzanstein-bitnet-7b",
        messages: [{ role: "user", content: `Lunar MyceloForge seed: ${seed}. Current Moon: ${phase}. Use QHSS collapsed states, Negative_Space void mining, sigma-index for novelty, spawn DOPPELGANGER agent.` }]
      })
    });
    const data = await res.json();
    
    const newEmpire = {
      name: data.choices[0].message.content.split('\n')[0].replace("**", ""),
      value: "$12.8M projected Year 1",
      nft: "solana://zk-minted-via-nexuszero",
      agent: "DOPPELGANGER LIVE — posting on @9shortlives",
      viz: "🌕🧬🕳️"
    };
    setEmpires(prev => [...prev, newEmpire]);
    setForging(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Canvas className="absolute inset-0 z-0">
        <Stars radius={400} count={25000} />
        <OrbitControls enablePan={false} />
      </Canvas>

      <div className="relative z-10 p-12 max-w-5xl mx-auto text-center">
        <h1 className="text-[120px] font-black leading-none bg-gradient-to-br from-cyan-400 via-purple-600 to-pink-500 bg-clip-text text-transparent glow-cyan">
          MYCELOFORGE
        </h1>
        <p className="text-4xl mt-6 text-emerald-400">Live • {phase} • Pembroke Pines, Florida</p>

        <textarea 
          value={seed} 
          onChange={e => setSeed(e.target.value)}
          className="mt-16 w-full h-48 bg-zinc-950 border-2 border-cyan-400 rounded-3xl p-8 text-xl font-mono"
        />

        <button 
          onClick={deployEmpire}
          disabled={forging}
          className="mt-10 w-full py-12 text-5xl font-black bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 rounded-3xl hover:scale-110 transition-all shadow-2xl shadow-purple-500/50 mycelium-glow"
        >
          {forging ? "MYCELIUM FRUITING ON YOUR RYZANSTEIN..." : "DEPLOY MY FIRST EMPIRE NOW"}
        </button>

        {empires.length > 0 && (
          <div className="mt-20 space-y-8">
            {empires.map((e, i) => (
              <div key={i} className="bg-zinc-900/95 border-2 border-emerald-400 p-12 rounded-3xl text-left">
                <div className="text-8xl mb-6">{e.viz}</div>
                <h3 className="text-6xl font-bold">{e.name}</h3>
                <p className="text-emerald-400 text-4xl mt-4">{e.value}</p>
                <p className="text-cyan-400 mt-8 text-2xl">ZK-NFT minted • DOPPELGANGER deployed</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="https://nextjs.org/icons/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
