import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Castle, Coins, Cloud, Moon, Sun, Star, Bird, Trees, Waves, Skull, Zap, Flag } from 'lucide-react';

interface BackgroundProps {
    population: number;
    gold: number;
    timeOfDay: 'DAY' | 'NIGHT';
    visitorType?: string;
}

export const Background: React.FC<BackgroundProps> = ({ population, gold, timeOfDay, visitorType }) => {
    // Calculate number of houses based on population
    const houseCount = Math.min(Math.floor(population / 8), 15); 
    
    // Calculate gold piles
    const goldCount = Math.min(Math.floor(gold / 25), 10);

    const isNight = timeOfDay === 'NIGHT';

    // Determine Palette based on Visitor Type & Time
    const palette = useMemo(() => {
        const base = isNight ? 'night' : 'day';
        
        const themes: any = {
            day: {
                sky: 'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 100%)',
                mountain: '#e2e8f0', // Slate 200
                mountainShadow: '#94a3b8', // Slate 400
                forestBack: '#475569', // Slate 600
                forestMid: '#1e293b', // Slate 800
                forestFront: '#0f172a', // Slate 900
                accent: '#fcd34d' // Amber 300
            },
            night: {
                sky: 'linear-gradient(to bottom, #020617 0%, #1e1b4b 100%)',
                mountain: '#334155', // Slate 700
                mountainShadow: '#1e293b', // Slate 800
                forestBack: '#1e1b4b', // Indigo 950
                forestMid: '#0f172a', // Slate 900
                forestFront: '#020617', // Slate 950
                accent: '#fbbf24' // Amber 400
            }
        };

        // Visitor Overrides
        if (visitorType === 'witch' || visitorType === 'necromancer') {
            return {
                sky: isNight ? 'linear-gradient(to bottom, #2e022e 0%, #4a044e 100%)' : 'linear-gradient(to bottom, #4c1d95 0%, #a855f7 100%)',
                mountain: isNight ? '#4a044e' : '#e9d5ff',
                mountainShadow: isNight ? '#2e022e' : '#c084fc',
                forestBack: '#581c87',
                forestMid: '#3b0764',
                forestFront: '#2e022e',
                accent: '#d8b4fe'
            };
        }
        
        if (visitorType === 'event') { // Danger
             return {
                sky: isNight ? 'linear-gradient(to bottom, #450a0a 0%, #7f1d1d 100%)' : 'linear-gradient(to bottom, #991b1b 0%, #fca5a5 100%)',
                mountain: '#fecaca',
                mountainShadow: '#ef4444',
                forestBack: '#991b1b',
                forestMid: '#7f1d1d',
                forestFront: '#450a0a',
                accent: '#fca5a5'
            };
        }

        return themes[base];
    }, [visitorType, isNight]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#0c0a09]">
            {/* Sky Gradient */}
            <motion.div 
                className="absolute inset-0 transition-colors duration-1000"
                initial={false}
                animate={{ background: palette.sky }}
            />

            {/* Stars (Night) */}
            <AnimatePresence>
                {isNight && (
                    <div className="absolute inset-0">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={`star-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.2, 0.8, 0.2] }}
                                transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                style={{ top: `${Math.random() * 40}%`, left: `${Math.random() * 100}%` }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Celestial Body */}
            <motion.div 
                className="absolute top-10 right-10 z-10"
                initial={false}
                animate={{ y: isNight ? 0 : 20, rotate: isNight ? -10 : 0 }}
                transition={{ duration: 2 }}
            >
                {isNight ? (
                    <div className="w-16 h-16 bg-slate-100 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] relative overflow-hidden">
                        <div className="absolute top-2 left-3 w-4 h-4 bg-slate-200 rounded-full opacity-50"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 bg-slate-200 rounded-full opacity-50"></div>
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-[#fcd34d] rounded-full shadow-[0_0_60px_rgba(252,211,77,0.8)] animate-pulse"></div>
                )}
            </motion.div>

            {/* Clouds (Pixel Art Style) */}
            <div className="absolute inset-0 opacity-80">
                <motion.div 
                    animate={{ x: [0, 100, 0] }} 
                    transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                    className="absolute top-20 left-10"
                >
                    <div className={`w-32 h-12 ${isNight ? 'bg-slate-700' : 'bg-white'} rounded-full opacity-80 relative`}>
                        <div className={`absolute -top-6 left-4 w-16 h-16 ${isNight ? 'bg-slate-700' : 'bg-white'} rounded-full`}></div>
                        <div className={`absolute -top-4 right-6 w-12 h-12 ${isNight ? 'bg-slate-700' : 'bg-white'} rounded-full`}></div>
                    </div>
                </motion.div>
                <motion.div 
                    animate={{ x: [0, -50, 0] }} 
                    transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                    className="absolute top-40 right-20"
                >
                     <div className={`w-24 h-10 ${isNight ? 'bg-slate-700' : 'bg-white'} rounded-full opacity-60 relative`}>
                        <div className={`absolute -top-4 left-4 w-10 h-10 ${isNight ? 'bg-slate-700' : 'bg-white'} rounded-full`}></div>
                    </div>
                </motion.div>
            </div>

            {/* MOUNTAINS LAYER (Back) */}
            <div className="absolute bottom-32 left-0 w-full h-[60%] z-0 flex items-end justify-center">
                {/* Left Mountain */}
                <motion.div 
                    animate={{ backgroundColor: palette.mountainShadow }}
                    className="w-[40%] h-[80%] clip-triangle absolute left-[-10%] bottom-0"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                />
                
                {/* Right Mountain */}
                <motion.div 
                    animate={{ backgroundColor: palette.mountainShadow }}
                    className="w-[50%] h-[70%] clip-triangle absolute right-[-10%] bottom-0"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                />

                {/* Center Majestic Mountain */}
                <motion.div 
                    animate={{ backgroundColor: palette.mountain }}
                    className="w-[60%] h-[100%] clip-triangle relative z-10"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                >
                    {/* Snow Cap */}
                    <div className="absolute top-0 left-0 w-full h-[30%] bg-white opacity-80" 
                         style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                </motion.div>
            </div>

            {/* FOREST LAYER 1 (Back) - Parallax */}
            <motion.div 
                animate={{ backgroundColor: palette.forestBack }}
                className="absolute bottom-24 left-0 w-full h-64 z-10"
                style={{ 
                    clipPath: 'polygon(0% 100%, 0% 20%, 5% 30%, 10% 15%, 15% 35%, 20% 20%, 25% 40%, 30% 10%, 35% 30%, 40% 15%, 45% 35%, 50% 20%, 55% 40%, 60% 10%, 65% 35%, 70% 20%, 75% 40%, 80% 15%, 85% 30%, 90% 10%, 95% 35%, 100% 20%, 100% 100%)'
                }}
            />

            {/* CASTLE (Mid-Ground) */}
            <div className="absolute bottom-40 left-[20%] z-20">
                 <Castle className={`w-48 h-48 ${isNight ? 'text-slate-800' : 'text-slate-300'} drop-shadow-2xl`} fill="currentColor" strokeWidth={1} />
                 {/* Windows */}
                 {isNight && (
                    <>
                        <div className="absolute top-16 left-[42%] w-3 h-5 bg-yellow-500 animate-pulse"></div>
                        <div className="absolute top-24 left-[25%] w-2 h-3 bg-orange-500 animate-pulse delay-100"></div>
                    </>
                 )}
            </div>

            {/* FOREST LAYER 2 (Mid) */}
            <motion.div 
                animate={{ backgroundColor: palette.forestMid }}
                className="absolute bottom-12 left-0 w-full h-48 z-20"
                style={{ 
                    clipPath: 'polygon(0% 100%, 0% 30%, 4% 10%, 8% 35%, 12% 15%, 16% 40%, 20% 20%, 24% 45%, 28% 10%, 32% 35%, 36% 20%, 40% 40%, 44% 15%, 48% 35%, 52% 10%, 56% 40%, 60% 20%, 64% 45%, 68% 15%, 72% 35%, 76% 10%, 80% 40%, 84% 20%, 88% 35%, 92% 10%, 96% 30%, 100% 15%, 100% 100%)'
                }}
            />

            {/* VILLAGE (Houses) - Integrated into the hills */}
            <div className="absolute bottom-16 left-0 w-full z-30 px-10 flex justify-end gap-8 pointer-events-none">
                {Array.from({ length: houseCount }).map((_, i) => (
                    <motion.div
                        key={`house-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                        style={{ marginBottom: Math.random() * 40 }} // Randomize height slightly
                    >
                        <Home className={`w-6 h-6 ${isNight ? 'text-slate-800 fill-slate-900' : 'text-[#3f2e18] fill-[#fde68a]'} drop-shadow-lg`} />
                        {isNight && (
                            <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* FOREST LAYER 3 (Front) - Framing */}
            <motion.div 
                animate={{ backgroundColor: palette.forestFront }}
                className="absolute -bottom-10 left-0 w-full h-40 z-40"
                style={{ 
                    clipPath: 'polygon(0% 100%, 0% 40%, 3% 20%, 6% 45%, 9% 25%, 12% 50%, 15% 30%, 18% 55%, 21% 35%, 24% 60%, 27% 40%, 30% 65%, 33% 45%, 36% 70%, 39% 50%, 42% 75%, 45% 55%, 48% 80%, 51% 60%, 54% 85%, 57% 65%, 60% 90%, 63% 70%, 66% 95%, 69% 75%, 72% 100%, 100% 100%)'
                }}
            />

            {/* GOLD PILES - Foreground */}
            <div className="absolute bottom-4 left-8 flex gap-2 z-50">
                {Array.from({ length: goldCount }).map((_, i) => (
                    <motion.div
                        key={`gold-${i}`}
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Coins className="w-4 h-4 text-yellow-500 drop-shadow-md" fill="currentColor" />
                    </motion.div>
                ))}
            </div>

            {/* Pixel Overlay for Texture */}
            <div className="absolute inset-0 pointer-events-none z-[60] opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] mix-blend-overlay"></div>
        </div>
    );
};
