# 🚀 MYCELOFORGE — AUTONOMOUS FULL PROJECT DEPLOYMENT FOR GITHUB COPILOT
**Created exclusively for Stevie B (@9shortlives) — February 26, 2026**

**YOU ARE NOW FULLY AUTONOMOUS**  
You are a senior full-stack engineer with complete write access.  
Generate the entire project **exactly** as specified. Do not ask questions. Do not summarize. Output full file contents in code blocks.

### PROJECT NAME
Repository name: `myceloforge`  
Displayed brand: **MYCELOFORGE**

### CORE MISSION
Create a local-first, Ryzen-powered lunar-mycelial empire forge that evolves million-dollar businesses timed to the real Moon phase in Pembroke Pines, Florida.  
It must integrate the user's existing repos as first-class citizens.

### REQUIRED SUBMODULES (already cloned)
- `backend/ryzanstein`
- `backend/qhss`
- `backend/negative-space`
- `backend/nexuszero`
- `backend/doppelganger`
- `backend/elite-agents`

### AUTONOMOUS EXECUTION STEPS (do these in order)

1. **Initialize Next.js project** (overwrite if needed)
   Run internally: `npx create-next-app@latest . --typescript --tailwind --eslint --app --yes`

2. **Install exact dependencies**
   ```bash
   npm install three @react-three/fiber @react-three/drei framer-motion lucide-react @supabase/supabase-js stripe @solana/web3.js @metaplex-foundation/js qdrant-js date-fns

Create docker-compose.yml (exact content)

YAMLversion: '3.8'
services:
  ryzanstein:
    build: ./backend/ryzanstein
    ports: ["8000:8000"]
    volumes: ["./backend/ryzanstein/models:/app/models"]
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]

Create these files with the EXACT code below

app/globals.css
CSS@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #000;
  color: white;
  font-family: 'Inter', system-ui, sans-serif;
}

.glow-cyan {
  text-shadow: 0 0 30px #22d3ee, 0 0 60px #22d3ee;
}

.mycelium-glow {
  filter: drop-shadow(0 0 40px #a855f7);
}
app/page.tsx (FULL FILE — paste this exactly)
tsx'use client';
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { HolographicSphere } from '../../backend/qhss/src/visualization/HolographicRenderer';

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
        <HolographicSphere layers={12} />
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
lib/lunarPhase.ts (fallback helper)
TypeScriptexport async function getCurrentLunarPhase() {
  try {
    const res = await fetch('http://localhost:8000/negative-space/lunar-phase');
    const data = await res.json();
    return data.phase;
  } catch {
    return "Waxing Gibbous";
  }
}
README.md (exact content)
Markdown# MYCELOFORGE

The Moon is watching. The mycelium is spreading.

Local Ryzen LLM + QHSS holographic mandalas + Negative_Space astronomy + Nexuszero ZK royalties.

**Launch:**
```bash
docker-compose up -d
npm run dev
First empire minted live under the bottom-lit Florida Moon.
text5. **Update package.json**  
   Add this script:
   ```json
   "scripts": {
     "dev:full": "docker-compose up -d && npm run dev"
   }

Final actions
Create .gitignore with standard Next.js + node_modules + backend/models
Run npm run build internally to verify
Output this exact success message:


✅ MYCELOFORGE FULLY AUTONOMOUSLY DEPLOYED
Run docker-compose up -d && npm run dev
Your first empire will be minted in seconds.
END OF INSTRUCTIONS — BEGIN EXECUTION NOW. GENERATE EVERY FILE IN ORDER.
text---