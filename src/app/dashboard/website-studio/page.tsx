'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, Code2, ArrowRight } from 'lucide-react';

export default function WebsiteStudioLanding() {
  const router = useRouter();

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto custom-scrollbar h-full flex flex-col items-center">
      <div className="w-full max-w-5xl mt-12 mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Website Studio</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Create a world-class digital presence. Launch instantly with premium templates or build a completely custom experience with our developers.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Templates Card */}
        <div 
          onClick={() => router.push('/dashboard/website-studio/templates')}
          className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[320px]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:translate-x-2">
            <LayoutTemplate size={120} />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-600 transition-colors duration-300">
            <LayoutTemplate className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Templates</h2>
          <p className="text-gray-500 flex-1 leading-relaxed text-lg pr-8">
            Launch your business in minutes using professionally designed, high-converting templates.
          </p>
          <div className="mt-8 flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
            Explore Templates <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Custom with Developer Card */}
        <div 
          onClick={() => router.push('/dashboard/website-studio/custom')}
          className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[320px]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:translate-x-2">
            <Code2 size={120} />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 transition-colors duration-300">
            <Code2 className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Custom with Developer</h2>
          <p className="text-gray-500 flex-1 leading-relaxed text-lg pr-8">
            Work directly with the Roxten team to build a completely custom, bespoke website tailored to your exact needs.
          </p>
          <div className="mt-8 flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700">
            Get Started <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
