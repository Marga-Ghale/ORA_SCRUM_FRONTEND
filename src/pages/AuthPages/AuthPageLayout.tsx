import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import ThemeTogglerTwo from '../../components/common/ThemeTogglerTwo';
import {
  AnimatedBackground,
  TypingText,
  FloatingParticles,
} from '../../components/common/AnimatedBackground';

const FeatureCard = ({ icon, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ x: 8, scale: 1.01 }}
    className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/8 hover:border-blue-400/30 transition-all duration-300 cursor-pointer"
  >
    <div className="flex items-start gap-4">
      <motion.div
        className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/20"
        whileHover={{ rotate: 5, scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-blue-300">{icon}</div>
      </motion.div>
      <div className="flex-1">
        <h4 className="text-base font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
          {title}
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  </motion.div>
);

const StatCard = ({ value, label, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 hover:border-blue-400/40 transition-all duration-300"
  >
    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
      {value}
    </div>
    <div className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{label}</div>
  </motion.div>
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [isTyping, setIsTyping] = useState(false);

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: 'Lightning Fast Sprints',
      description: 'Plan and execute sprints with unprecedented speed and efficiency',
      delay: 0.2,
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: 'Team Collaboration',
      description: 'Work together seamlessly with real-time updates and notifications',
      delay: 0.3,
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Powerful Analytics',
      description: 'Track progress with actionable insights and visualizations',
      delay: 0.4,
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
      title: 'Flexible Workflows',
      description: "Customize workflows to match your team's unique processes",
      delay: 0.5,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Form */}
        <div className="flex flex-col w-full lg:w-1/2 relative z-10 bg-white dark:bg-gray-950">
          <motion.div
            className="p-6 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/" className="inline-flex items-center gap-3 group">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 10, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-white font-black text-lg">OS</span>
              </motion.div>
              <div>
                <div className="font-black text-gray-900 dark:text-white text-xl leading-none">
                  ORA SCRUM
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Agile Made Simple
                </div>
              </div>
            </Link>
          </motion.div>

          <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full max-w-md"
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
            >
              {children}
            </motion.div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <AnimatedBackground isTyping={isTyping} />
          <FloatingParticles />

          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link to="/" className="inline-flex items-center gap-4 group">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl"
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-white font-black text-2xl">OS</span>
                </motion.div>
                <div>
                  <div className="font-black text-white text-3xl leading-none tracking-tight">
                    ORA SCRUM
                  </div>
                  <div className="text-sm text-blue-300 font-bold mt-1">Agile Made Simple</div>
                </div>
              </Link>
            </motion.div>

            <div className="space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-6"
              >
                <h2 className="text-5xl font-black text-white leading-tight">
                  Streamline Your
                  <br />
                  <TypingText
                    texts={[
                      'Agile Workflow',
                      'Sprint Planning',
                      'Team Collaboration',
                      'Project Success',
                    ]}
                    className="text-5xl font-black"
                    onTypingChange={setIsTyping}
                  />
                </h2>
                <p className="text-lg text-gray-300 max-w-md leading-relaxed">
                  Manage sprints, track progress, and collaborate with your team in one powerful
                  platform
                </p>
              </motion.div>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <FeatureCard key={index} {...feature} />
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="grid grid-cols-3 gap-4"
            >
              <StatCard value="50K+" label="Active Users" delay={0.7} />
              <StatCard value="99.9%" label="Uptime" delay={0.8} />
              <StatCard value="4.9★" label="Rating" delay={0.9} />
            </motion.div>
          </div>
        </div>

        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <ThemeTogglerTwo />
        </motion.div>
      </div>
    </div>
  );
}
