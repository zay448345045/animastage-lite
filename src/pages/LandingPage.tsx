import { motion } from "motion/react";
import { 
  Box, 
  Wind, 
  Video, 
  Zap, 
  Tv, 
  Smartphone, 
  Layers, 
  Target, 
  Play, 
  CheckCircle, 
  Terminal,
  ChevronRight,
  Sparkles,
  Camera,
  Layers3,
  Flame,
  ArrowRight
} from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-fuchsia-950/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] left-10 w-[400px] h-[400px] bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/75 border-b border-zinc-905/80 border-b-zinc-900 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-wide bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                AnimaStage<span className="text-purple-400 font-semibold text-sm ml-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">Lite</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button 
              onClick={() => scrollToSection("what-is-lite")} 
              className="hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              What is it?
            </button>
            <button 
              onClick={() => scrollToSection("for-whom")} 
              className="hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              Who it's for
            </button>
            <button 
              onClick={() => scrollToSection("features")} 
              className="hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection("v916")} 
              className="hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              9:16 Format
            </button>
            <button 
              onClick={() => scrollToSection("start-running")} 
              className="hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              Quick Start
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onStart}
              className="group relative cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-purple-600/20 transition-all hover:shadow-purple-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <span>Open Studio</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center">
            
            {/* Visual Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-purple-400 mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full 3D staging directly in your browser</span>
            </motion.div>

            {/* H1 Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight mb-4 text-white"
            >
              AnimaStage <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Lite</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-xl sm:text-2xl text-zinc-300 font-medium tracking-wide mb-6"
            >
              Web studio for MikuMikuDance
            </motion.p>

            {/* Slogan */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-purple-200 font-medium text-lg max-w-2xl mx-auto mb-6"
            >
              &ldquo;MMD staging in the browser — animation, physics, lighting, and Shorts in minutes&rdquo;
            </motion.p>

            {/* Broad Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-zinc-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed mb-10"
            >
              A browser-based environment for PMX/PMD, VMD, timeline, cloth physics, cinematic lighting, and vertical video export — no MikuMikuDance installation required. Everything you need is in one lightweight, fast web interface.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <button
                onClick={onStart}
                className="group w-full sm:w-auto relative cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-xl shadow-purple-600/20 hover:shadow-purple-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <span>Launch AnimaStage Lite</span>
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={() => scrollToSection("what-is-lite")}
                className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white font-semibold text-base px-8 py-4 rounded-xl border border-zinc-850 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-700/50"
              >
                <span>Features</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Tech Specs Badge list */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-500 font-mono tracking-wider uppercase"
            >
              <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-purple-400" /> WebGL 2.0</span>
              <span className="text-zinc-800">•</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-purple-400" /> Shorts Ready 9:16</span>
              <span className="text-zinc-800">•</span>
              <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-purple-400" /> WebCodecs MP4</span>
              <span className="text-zinc-800">•</span>
              <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-purple-400" /> Bullet Physics</span>
            </motion.div>

            {/* Interactive Scene Mock Visual */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 sm:mt-20 relative rounded-2xl border border-zinc-800 bg-zinc-950 p-2 overflow-hidden shadow-2xl shadow-purple-950/20"
            >
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
              
              {/* Flaunt floats mirroring the "Professional Polish Viewport" demo widgets */}
              <div className="absolute -right-4 top-1/4 p-3 bg-zinc-900/95 backdrop-blur border border-zinc-700/60 rounded-lg text-[10px] font-mono text-purple-400 shadow-xl z-20 select-none">
                DPR 1.0x Lite Mode
              </div>
              <div className="absolute -left-4 bottom-1/4 p-3 bg-zinc-900/95 backdrop-blur border border-zinc-700/60 rounded-lg text-[10px] font-mono text-cyan-450 text-cyan-400 shadow-xl z-20 select-none">
                RTX-Lite Enabled
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 aspect-[16/9] flex items-center justify-center relative overflow-hidden">
                
                {/* 3D Wireframe/Grid Placeholder */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  <span>3D STAGE ACTIVE</span>
                </div>

                <div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center z-10">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-500/25 to-indigo-500/25 border border-purple-500/30 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-zinc-200">Full 3D rendering environment</h4>
                    <p className="text-zinc-500 text-xs mt-1">Load PMX models, VMD motion files, and export MP4 / Shorts in a single click.</p>
                  </div>
                  <button 
                    onClick={onStart}
                    className="cursor-pointer text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2 focus:outline-none"
                  >
                    Launch in sandbox <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simulated UI Overlays */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border-t border-zinc-800/80 pt-4 text-[10px] font-mono text-zinc-500">
                  <div className="flex gap-4">
                    <span>MODEL: Loaded</span>
                    <span>MOTION: Set (9:16 Ready)</span>
                  </div>
                  <div className="flex gap-3">
                    <span>FPS: 60.0</span>
                    <span>MEM: 18.5 MB</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* SECTION: WHAT IS LITE */}
        <section id="what-is-lite" className="py-20 bg-zinc-950 border-t border-zinc-900/60 relative scroll-mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-900/40 text-xs text-purple-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>What is the Lite version?</span>
                </div>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                  Your MMD stage, always at hand
                </h2>
                <p className="text-zinc-400 leading-relaxed text-base sm:text-lg">
                  AnimaStage Lite is a high-performance 3D platform optimized specifically for running MMD content in modern WebGL2-based web browsers.
                </p>
                
                <div className="space-y-4 pt-2">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200">Instant 3D stage</h4>
                      <p className="text-sm text-zinc-400 mt-0.5">A fully functional 3D environment directly in the browser, with no DirectX or MMD installation required.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200">Stability and lightweight rendering</h4>
                      <p className="text-sm text-zinc-400 mt-0.5">Special focus on 9:16 vertical format and an optimized render loop for maximum frame rate stability without overheating the GPU.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200">~80% visual quality</h4>
                      <p className="text-sm text-zinc-400 mt-0.5">Achieve impressive graphics with reduced GPU load. An excellent alternative to heavy offline rendering.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic container comparing Heavy MMD to AnimaStage Lite */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <h3 className="font-display font-semibold text-zinc-200 text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  Smart performance balance
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-mono mb-1.5 uppercase">
                      <span>GPU Load (Consumption)</span>
                      <span className="text-emerald-400 font-bold">-60% Optimal</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-emerald-500 to-purple-500 h-full rounded-full" style={{ width: "40%" }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                      <span>AnimaStage Lite: Lightweight rendering</span>
                      <span>Standard MMD: Heavy rendering (100%)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-mono mb-1.5 uppercase">
                      <span>Visual fidelity and effects</span>
                      <span className="text-purple-400 font-bold">~80% Quality</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full" style={{ width: "80%" }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                      <span>Optimized styles, DOF, and HDR</span>
                      <span>Heavyweight PC shaders</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-mono mb-1.5 uppercase">
                      <span>Video export time</span>
                      <span className="text-fuchsia-400 font-bold">5× Faster</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-full rounded-full" style={{ width: "20%" }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                      <span>Browser WebCodecs (Seconds)</span>
                      <span>Traditional rendering (Minutes)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/60 text-xs text-zinc-500 leading-relaxed italic">
                  *Lite is designed for quick preview and mobile editing. A convenient alternative to desktop apps for everyday content creator workflows.
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: FOR WHOM */}
        <section id="for-whom" className="py-20 bg-zinc-950 border-t border-zinc-900/60 relative scroll-mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-900/40 text-xs text-purple-400 mb-4">
                <Target className="w-3.5 h-3.5" />
                <span>Target audience</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                Who is AnimaStage Lite for?
              </h2>
              <p className="text-zinc-500 mt-2 text-base">
                The ideal balance between workflow speed and creative capability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1 */}
              <div className="bg-zinc-900/30 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-350 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-purple-950/50 border border-purple-900/50 flex items-center justify-center text-purple-400 mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-zinc-200 text-lg mb-2">Vertical video creators</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Perfect export in portrait 1080×1920 (9:16). Create trending Shorts, Reels, and TikTok videos in minutes — no limits.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-zinc-900/30 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-350 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-purple-950/50 border border-purple-900/50 flex items-center justify-center text-purple-400 mb-4">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-zinc-200 text-lg mb-2">MMD enthusiasts</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Quick preview and testing of PMX/PMD 3D models, animations, and VMD motions directly in the browser. Skip the long background prep.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-zinc-900/30 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-350 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-purple-950/50 border border-purple-900/50 flex items-center justify-center text-purple-400 mb-4">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-zinc-200 text-lg mb-2">Video editors</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Full timeline, free camera control, and instant clean-frame capture with no UI elements. No OBS!
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-zinc-900/30 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-350 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-purple-950/50 border border-purple-900/50 flex items-center justify-center text-purple-400 mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-zinc-200 text-lg mb-2">Low-spec PC users</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Lightweight rendering, resource optimization, and automatic WebGL context recovery when memory runs low.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: FEATURES */}
        <section id="features" className="py-20 bg-zinc-950 border-t border-zinc-900/60 relative scroll-mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-900/40 text-xs text-purple-400 mb-4">
                <Box className="w-3.5 h-3.5" />
                <span>Specifications &amp; tools</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                Platform capabilities
              </h2>
              <p className="text-zinc-500 mt-2 text-base">
                A powerful feature stack integrated into a compact web editor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-850 hover:border-zinc-850 hover:bg-zinc-900/40 transition-all flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-zinc-200 text-base mb-1">1. Stage &amp; Import</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Fast PMX, PMD, and VMD workflow via drag &amp; drop. Configurable HDR environment, preset lighting, and stage grid.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-850 hover:border-zinc-850 hover:bg-zinc-900/40 transition-all flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Layers3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-zinc-200 text-base mb-1">2. Motion &amp; Timeline</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Full timeline with dopesheet layout, interpolation curve editing, and modified motion export to VMD.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-850 hover:border-zinc-850 hover:bg-zinc-900/40 transition-all flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-zinc-200 text-base mb-1">3. Real-time physics</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Bullet Physics simulation for hair, skirts, belts, and accessories. Adjustable wind strength and direction.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-850 hover:border-zinc-850 hover:bg-zinc-900/40 transition-all flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-zinc-200 text-base mb-1">4. RTX Lite visual styles</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Cinematic post-processing: depth of field (DOF), soft bloom, weather effects (rain, snow), and color grading.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-850 hover:border-zinc-850 hover:bg-zinc-900/40 transition-all flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-zinc-200 text-base mb-1">5. High-quality capture</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Direct WebCodecs recording to high-quality MP4 with no timeline slowdown. Clean-frame modes hide all UI and gizmo overlays.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-850 hover:border-zinc-850 hover:bg-zinc-900/40 transition-all flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-zinc-200 text-base mb-1">6. Advanced Pro features</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Animation layer support for motion blending, local mocap device integration, and WebRTC collaboration.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: 9:16 LITE SPECIAL FEATURE */}
        <section id="v916" className="py-20 bg-zinc-950 border-t border-zinc-900/60 relative scroll-mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl border border-zinc-800 bg-linear-to-r from-zinc-900 to-purple-950/45 p-8 sm:p-12 overflow-hidden flex flex-col lg:flex-row items-center gap-12">
              
              {/* Blur gradient accent inside */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 max-w-xl lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-900/40 text-xs text-purple-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile format &amp; optimization</span>
                </div>
                
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                  Stable 9:16 Lite mode
                </h2>
                
                <p className="text-zinc-300 text-base leading-relaxed">
                  We reimagined hardware requirements for portable web apps. Our 9:16 rendering mode delivers maximum performance.
                </p>

                <ul className="space-y-3.5 text-sm text-zinc-400 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Fixed 1× DPR aspect ratio (lightweight rendering)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Automatic scaling and quick width-based cropping</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Export at native vertical resolution 1080×1920</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Resilient WebGL context recovery under OS memory pressure</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    onClick={onStart}
                    className="cursor-pointer inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-600/10 focus:outline-none"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Graphic UI Simulator showing 9:16 frame inside landscape stage */}
              <div className="lg:w-1/2 flex items-center justify-center p-4">
                <div className="w-[280px] h-[480px] rounded-3xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl relative">
                  
                  {/* Status Bar */}
                  <div className="h-4 flex justify-between items-center px-4 mb-2 text-[8px] font-mono text-zinc-600">
                    <span>1080 x 1920</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2.5 h-1.5 border border-zinc-600 rounded-xs" />
                      <span>9:16 LITE</span>
                    </div>
                  </div>

                  {/* Active viewport box */}
                  <div className="relative h-[390px] rounded-xl border border-dashed border-purple-500/40 bg-zinc-900/60 flex flex-col items-center justify-between p-4 overflow-hidden">
                    <div className="absolute top-2 right-2 bg-purple-950/80 border border-purple-900/40 text-[7px] font-mono text-purple-300 px-2 py-0.5 rounded">
                      DPR 1.0X
                    </div>

                    <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                    {/* Simple geometric Miku model standin */}
                    <div className="my-auto flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full border-2 border-purple-400 bg-purple-950/80 flex items-center justify-center relative">
                        <div className="absolute -left-4 -top-1 w-4 h-12 border-l border-b border-purple-400/60 rounded-bl-lg transform -rotate-12" />
                        <div className="absolute -right-4 -top-1 w-4 h-12 border-r border-b border-purple-400/60 rounded-br-lg transform rotate-12" />
                        <span className="text-[10px] font-bold text-purple-400">PMX</span>
                      </div>
                      <div className="h-16 w-8 bg-zinc-950/80 border border-zinc-800 rounded-md mt-2 relative">
                        <div className="absolute bottom-2 inset-x-1 h-3 bg-red-950/30 rounded border border-red-800/40" />
                      </div>
                    </div>

                    <div className="w-full space-y-1 z-10 text-center">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wide">VMD Import</span>
                      <div className="h-6 bg-zinc-950/90 border border-zinc-850 rounded flex items-center justify-center p-1">
                        <div className="w-full bg-purple-500/10 border border-purple-500/20 rounded h-full flex items-center px-1.5 text-[8px] font-medium text-zinc-300">
                          <Play className="w-2 h-2 text-purple-400 mr-1.5 fill-current" /> miku_animation.vmd
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Trigger Simulation */}
                  <div className="mt-3.5 flex justify-center">
                    <div className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-center text-[9px] font-mono text-purple-400 font-semibold flex items-center justify-center gap-1">
                      <Camera className="w-3 h-3 text-purple-400" /> Generate MMD Shorts
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: QUICK START */}
        <section id="start-running" className="py-20 bg-zinc-950 border-t border-zinc-900/60 relative scroll-mt-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-900/40 text-xs text-purple-400 mb-4">
                <Terminal className="w-3.5 h-3.5" />
                <span>Run locally</span>
              </div>
              <h2 className="font-display font-bold text-3xl text-white tracking-tight">
                Ready to set sail?
              </h2>
              <p className="text-zinc-400 mt-2 text-sm">
                Instructions for developers and enthusiasts who want to run the project on their machine.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded bg-purple-950 text-purple-400 border border-purple-900/60 flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-zinc-200 text-sm">Check external requirements</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Node.js 18+ and a modern Chromium-based browser (Chrome, Edge, Opera) with WebGL2 support are required.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded bg-purple-950 text-purple-400 border border-purple-900/60 flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-zinc-200 text-sm">Install dependencies and start the dev server</h4>
                    <p className="text-xs text-zinc-500 mt-1 mb-2 font-mono uppercase tracking-wider">TERMINAL COMMANDS</p>
                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-900 font-mono text-xs text-zinc-300 relative overflow-x-auto select-all">
                      <div className="text-zinc-500 mb-1"># Set up the repository locally</div>
                      <div>npm install</div>
                      <div className="text-zinc-500 my-1"># Start the development server</div>
                      <div>npm run dev</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded bg-purple-950 text-purple-400 border border-purple-900/60 flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-zinc-200 text-sm">Open in your browser</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Navigate to <span className="font-mono text-purple-300">http://localhost:3000</span> to start working in the browser.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                  The app uses WebCodecs for exceptionally fast, high-quality 1080p video export.
                </span>
                <button
                  onClick={onStart}
                  className="cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all focus:outline-none"
                >
                  <span>Launch in sandbox</span>
                  <Play className="w-3 w-[12px] h-3 fill-current" />
                </button>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 sm:px-6 lg:px-8 py-10 text-xs font-medium text-zinc-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-zinc-300 tracking-wide">
              AnimaStage<span className="text-purple-500 text-[10px] ml-1">Lite</span>
            </span>
          </div>

          <div className="text-center md:text-left leading-relaxed max-w-md text-zinc-500">
            All MMD models (PMX / PMD) and animation tracks (VMD) belong to their respective authors and rights holders. This studio does not store or distribute creators&apos; intellectual property.
          </div>

          <div className="flex items-center gap-4">
            <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800/85 font-mono text-[10px] text-zinc-400">
              animastage-lite@1.0.0
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
