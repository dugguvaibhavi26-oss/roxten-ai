'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingSelection() {
  const router = useRouter();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Roxten AI-OS</span>
        </h1>
        <p className="text-lg text-gray-900/60 max-w-2xl mx-auto">
          You are about to deploy an autonomous AI workforce. How would you like to begin?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Existing Business */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onClick={() => router.push('/dashboard/onboarding')}
          className="group relative p-8 rounded-3xl bg-white/[0.02] border border-gray-200 hover:bg-white/[0.04] hover:border-indigo-500/50 transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-indigo-300 transition-colors">I have an existing business</h3>
              <p className="text-gray-900/50 leading-relaxed">
                Import your current company structure, inject your knowledge base, and hire specific AI agents to automate existing workflows.
              </p>
            </div>

            <div className="pt-4 flex items-center text-sm font-medium text-indigo-400 group-hover:translate-x-2 transition-transform duration-300">
              Configure AI Workforce <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </motion.button>

        {/* New Startup */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onClick={() => router.push('/onboarding/company-builder')}
          className="group relative p-8 rounded-3xl bg-white/[0.02] border border-gray-200 hover:bg-white/[0.04] hover:border-purple-500/50 transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Rocket className="w-6 h-6 text-purple-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-purple-300 transition-colors">Let's build your AI Company</h3>
              <p className="text-gray-900/50 leading-relaxed">
                Meet your AI Architect. Let us interview you about your business, generate a complete Business Blueprint, and automatically build your initial AI organization.
              </p>
            </div>

            <div className="pt-4 flex items-center text-sm font-medium text-purple-400 group-hover:translate-x-2 transition-transform duration-300">
              Meet your AI Co-Founder <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
