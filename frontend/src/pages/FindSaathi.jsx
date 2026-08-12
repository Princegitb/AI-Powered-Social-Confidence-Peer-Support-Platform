import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles, ArrowRight, Lock } from 'lucide-react';
import SkeletonCard from '../components/ui/SkeletonCard';
import useUserStore from '../store/userStore';

/**
 * Find Your Saathi — browse seeded peer profiles and start an anonymous chat.
 */
export default function FindSaathi() {
  const navigate = useNavigate();
  const [saathis, setSaathis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/peer/saathi/all')
      .then((r) => r.json())
      .then((d) => setSaathis(d.saathis || []))
      .catch(() => setSaathis([]))
      .finally(() => setLoading(false));
  }, []);

  const INTENT_DESCRIPTIONS = {
    casual: 'Just want someone to talk to.',
    practice: 'I want to practise communicating.',
    support: 'I am having a difficult day.',
    listening: "I don't need advice, just someone to listen.",
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-h1">Find Your Saathi</h1>
        <p className="text-body mt-1.5 max-w-xl">
          Real conversations with real people — anonymous, moderated, and matched
          to your vibe. Pick someone who feels right.
        </p>
      </motion.div>

      {/* Intent picker card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="card"
      >
        <p className="text-label text-primary mb-3">Safe Conversation Mode</p>
        <p className="text-body text-[13.5px] mb-4">
          Pick how you'd like to show up. Your saathi will see the same label,
          so you both know what to expect.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {Object.entries(INTENT_DESCRIPTIONS).map(([id, desc]) => (
            <div
              key={id}
              className="px-3 py-3 bg-surface-soft rounded-2xl"
            >
              <p className="text-[13px] font-semibold text-text-primary capitalize mb-0.5">
                {id}
              </p>
              <p className="text-[11.5px] text-text-tertiary leading-snug">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Saathi grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} height={200} />
            ))
          : saathis.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="card relative overflow-hidden group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent-lilac flex items-center justify-center text-white text-[18px] font-bold">
                    {s.alias[0]}
                  </div>
                  <div>
                    <h3 className="text-h2 text-[17px]">{s.alias}</h3>
                    <p className="text-[12px] text-text-tertiary capitalize">{s.intent}</p>
                  </div>
                </div>

                <p className="text-body text-[13.5px] mb-4 min-h-[3rem]">
                  {s.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 bg-surface-soft text-[11.5px] text-text-secondary rounded-full"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/peer/chat/${s.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-[14px] font-medium hover:bg-primary-dark transition-colors group-hover:gap-3"
                >
                  Match
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="card card-soft text-center"
      >
        <p className="text-[13px] text-text-secondary">
          <Lock size={13} className="inline -mt-0.5 mr-1" />
          All conversations are anonymous. Sharing contact info is auto-redacted.
          You can end any conversation at any time.
        </p>
      </motion.div>
    </div>
  );
}