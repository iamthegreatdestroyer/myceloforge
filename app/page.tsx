"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Zap, Moon, Grid3x3, Sparkles } from "lucide-react";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });
const HolographicSphere = dynamic(() => import("../components/HolographicSphere"), { ssr: false });

export default function MyceloForge() {
  const [seed, setSeed] = useState(
    "Pembroke Pines Florida bottom-lit Moon during day → wealth oracle",
  );
  const [phase, setPhase] = useState("Waxing Gibbous 72%");
  const [forging, setForging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empires, setEmpires] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/lunar-phase")
      .then((r) => r.json())
      .then((d) => setPhase(d.phase || "Waxing Gibbous"))
      .catch((e) => {
        console.error("Failed to fetch lunar phase:", e);
        setPhase("Waxing Gibbous");
      });
  }, []);

  const deployEmpire = async () => {
    setForging(true);
    try {
      const res = await fetch("/api/empire/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: `Lunar MyceloForge seed: ${seed}. Current Moon: ${phase}. Use QHSS collapsed states, Negative_Space void mining, sigma-index for novelty, spawn DOPPELGANGER agent.`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Failed to deploy empire"}`);
        setForging(false);
        return;
      }

      const data = await res.json();
      const newEmpire = {
        name: data.choices[0].message.content.split("\n")[0].replace("**", ""),
        value: "$12.8M projected Year 1",
        nft: "solana://zk-minted-via-nexuszero",
        agent: "DOPPELGANGER LIVE — posting on @9shortlives",
        viz: "🌕🧬🕳️",
      };
      setEmpires((prev) => [...prev, newEmpire]);
    } catch (error) {
      console.error("Empire deployment error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setForging(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Scene />

      <div className="relative z-10 p-12 max-w-5xl mx-auto text-center">
        {/* Title Animation */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-[120px] font-black leading-none bg-gradient-to-br from-cyan-400 via-purple-600 to-pink-500 bg-clip-text text-transparent glow-cyan"
        >
          MYCELOFORGE
        </motion.h1>

        {/* Lunar Phase with Icon Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl mt-6 text-emerald-400 flex items-center justify-center gap-3"
        >
          <Moon size={48} className="animate-pulse" />
          <span>Live • {phase} • Pembroke Pines, Florida</span>
        </motion.div>

        {/* Holographic Sphere */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-12 h-48 flex justify-center"
        >
          <HolographicSphere isDeploying={forging} />
        </motion.div>

        {/* Textarea with Glow */}
        <motion.textarea
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="mt-16 w-full h-48 bg-zinc-950 border-2 border-cyan-400 rounded-3xl p-8 text-xl font-mono focus:outline-none focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/50 transition-all"
          placeholder="Enter your empire seed..."
        />

        {/* Deploy Button with Animation */}
        <motion.button
          onClick={deployEmpire}
          disabled={forging}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{ scale: forging ? 1 : 1.05 }}
          whileTap={{ scale: forging ? 1 : 0.95 }}
          className="mt-10 w-full py-12 text-5xl font-black bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 rounded-3xl hover:shadow-2xl hover:shadow-purple-500/50 shadow-2xl shadow-purple-500/50 mycelium-glow disabled:opacity-75 transition-all flex items-center justify-center gap-3"
        >
          {forging ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Grid3x3 size={48} />
              </motion.div>
              MYCELIUM FRUITING ON YOUR RYZANSTEIN...
            </>
          ) : (
            <>
              <Zap size={48} />
              DEPLOY MY FIRST EMPIRE NOW
            </>
          )}
        </motion.button>

        {/* Empire Cards with Staggered Animation */}
        {empires.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-20 space-y-8"
          >
            {empires.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(34, 197, 94, 0.5)" }}
                className="bg-zinc-900/95 border-2 border-emerald-400 p-12 rounded-3xl text-left cursor-pointer transition-all"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: i * 0.15 + 0.5, repeat: Infinity, duration: 4 }}
                  className="text-8xl mb-6"
                >
                  {e.viz}
                </motion.div>
                <h3 className="text-6xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text">
                  {e.name}
                </h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 + 0.2 }}
                  className="text-emerald-400 text-4xl mt-4 flex items-center gap-2"
                >
                  <Sparkles size={32} />
                  {e.value}
                </motion.p>
                <p className="text-cyan-400 mt-8 text-2xl">
                  ZK-NFT minted • DOPPELGANGER deployed
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
