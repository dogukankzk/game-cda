import React, { useState, useEffect, useRef } from 'react';
import { Kingdom } from '../game/Kingdom';
import { Visitor } from '../game/Visitor';
import { VisitorFactory } from '../game/VisitorFactory';
import { Background } from './Background';
import { supabase } from '../services/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Users, Crown, Check, X, Skull, Trophy, RotateCcw, Sun, Moon } from 'lucide-react';

type GameState = 'PLAYING' | 'GAME_OVER_LOSS' | 'GAME_OVER_WIN';
type TimeOfDay = 'DAY' | 'NIGHT';

export default function GameScreen() {
  const kingdomRef = useRef<Kingdom>(new Kingdom(100, 50));
  const [gold, setGold] = useState(100);
  const [population, setPopulation] = useState(50);
  
  const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  
  const [lastLog, setLastLog] = useState<string>("Bienvenue, Votre Majesté. La cour est ouverte.");
  const [day, setDay] = useState(1);
  const [interactionDisabled, setInteractionDisabled] = useState(false);

  // Cycle State
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('DAY');
  const [interactionsLeft, setInteractionsLeft] = useState(0);

  // Floating text state
  const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, type: 'gold' | 'pop' | 'neutral', x: number, y: number}[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('event')
            .select('*');
        
        if (error) {
            console.error('Error fetching events:', error);
        } else if (data) {
            // Map Supabase data to VisitorData format
            const mappedEvents = data.map((event: any) => ({
                name: event.name || "Inconnu",
                desc: event.description || event.desc || "...",
                type: event.type || "commoner",
                seed: event.seed || event.name || "Random",
                cost: event.cost_gold || event.cost || 0,
                rewardGold: event.reward_gold || 0,
                rewardPop: event.reward_pop || 0,
                costPop: event.cost_pop || 0,
                yesLabel: event.yes_label || "Accepter",
                noLabel: event.no_label || "Refuser",
                successMsg: event.success_msg,
                failMsg: event.fail_msg,
                refuseMsg: event.refuse_msg,
                requiredTime: event.required_time as 'DAY' | 'NIGHT' | undefined,
                // New fields for logic
                minGold: event.min_gold,
                minPop: event.min_pop,
                requiredFlag: event.req_flag || event.required_flag,
                forbiddenFlag: event.forbidden_flag,
                setFlag: event.set_flag,
                removeFlag: event.remove_flag,
                chance: event.chance // Expecting 0.0 to 1.0
            }));
            VisitorFactory.addExternalEvents(mappedEvents);
            console.log('Loaded external events:', mappedEvents.length);
        }
    };

    fetchEvents();
    startNewDay();
  }, []);

  const addFloatingText = (text: string, type: 'gold' | 'pop' | 'neutral', x: number, y: number) => {
    const id = nextId.current++;
    setFloatingTexts(prev => [...prev, { id, text, type, x, y }]);
    setTimeout(() => {
        setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 2000);
  };

  const updateKingdomState = (prevGold: number, prevPop: number) => {
    const currentGold = kingdomRef.current.getGold();
    const currentPop = kingdomRef.current.getPopulation();
    
    setGold(currentGold);
    setPopulation(currentPop);

    // Calculate deltas and show floating text
    const goldDelta = currentGold - prevGold;
    const popDelta = currentPop - prevPop;

    if (goldDelta !== 0) {
        addFloatingText(`${goldDelta > 0 ? '+' : ''}${goldDelta}`, 'gold', 20, -20);
    }
    if (popDelta !== 0) {
        addFloatingText(`${popDelta > 0 ? '+' : ''}${popDelta}`, 'pop', 80, -20);
    }

    // Check Win/Loss
    if (currentGold <= 0 || currentPop <= 0) {
        setGameState('GAME_OVER_LOSS');
    } else if (day > 20) { // Win condition: Survive PAST 20 days
        setGameState('GAME_OVER_WIN');
    }
  };

  const [showDayNightTransition, setShowDayNightTransition] = useState<'DAY' | 'NIGHT' | null>(null);

  const startNewDay = async () => {
    setInteractionDisabled(false);
    setTimeOfDay('DAY');
    setShowDayNightTransition('DAY');
    
    // 3 to 5 interactions for Day
    const count = Math.floor(Math.random() * 3) + 3;
    setInteractionsLeft(count);
    
    const newVisitor = VisitorFactory.createVisitor(kingdomRef.current, 'DAY');
    setCurrentVisitor(newVisitor);
    setLastLog(`Jour ${day} : Le soleil se lève sur le royaume.`);

    setTimeout(() => setShowDayNightTransition(null), 2000);
  };

  const startNight = async () => {
      setInteractionDisabled(false);
      setTimeOfDay('NIGHT');
      setShowDayNightTransition('NIGHT');

      // 2 to 4 interactions for Night
      const count = Math.floor(Math.random() * 3) + 2;
      setInteractionsLeft(count);

      const newVisitor = VisitorFactory.createVisitor(kingdomRef.current, 'NIGHT');
      setCurrentVisitor(newVisitor);
      setLastLog("La nuit tombe. Les ombres s'allongent...");

      setTimeout(() => setShowDayNightTransition(null), 2000);
  };

  const nextVisitor = async () => {
      const newVisitor = VisitorFactory.createVisitor(kingdomRef.current, timeOfDay);
      setCurrentVisitor(newVisitor);
      setInteractionDisabled(false);
  };

  const handleDecision = (decision: "YES" | "NO") => {
    if (!currentVisitor || interactionDisabled || gameState !== 'PLAYING') return;

    setInteractionDisabled(true);

    const prevGold = kingdomRef.current.getGold();
    const prevPop = kingdomRef.current.getPopulation();

    const resultLog = currentVisitor.applyEffect(decision, kingdomRef.current);
    
    setLastLog(resultLog);
    updateKingdomState(prevGold, prevPop);
    
    if (gameState === 'PLAYING') {
        setTimeout(() => {
            setCurrentVisitor(null);
            
            // Check Game Over again just in case
            const currentGold = kingdomRef.current.getGold();
            const currentPop = kingdomRef.current.getPopulation();
            
            if (currentGold > 0 && currentPop > 0 && day <= 20) {
                const nextInteractions = interactionsLeft - 1;
                setInteractionsLeft(nextInteractions);

                setTimeout(() => {
                    if (nextInteractions > 0) {
                        nextVisitor();
                    } else {
                        // Cycle Change
                        if (timeOfDay === 'DAY') {
                            startNight();
                        } else {
                            setDay(d => d + 1);
                            startNewDay();
                        }
                    }
                }, 1000);
            }
        }, 1500);
    }
  };

  const restartGame = () => {
      kingdomRef.current = new Kingdom(100, 50);
      setGold(100);
      setPopulation(50);
      setDay(1);
      setLastLog("Une nouvelle ère commence !");
      setGameState('PLAYING');
      setInteractionDisabled(false);
      startNewDay();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-500/30 overflow-hidden relative transition-colors duration-1000">
      
      {/* Dynamic Background */}
      <Background 
        population={population} 
        gold={gold} 
        timeOfDay={timeOfDay} 
        visitorType={currentVisitor?.getCharacterType()}
      />

      {/* Header / Stats */}
      <header className={`backdrop-blur-md border-b border-white/10 p-4 shadow-2xl sticky top-0 z-50 transition-colors duration-1000 ${timeOfDay === 'NIGHT' ? 'bg-slate-950/80' : 'bg-slate-900/60'}`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 text-amber-400 drop-shadow-glow">
            <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30 relative overflow-hidden group">
                <div className="absolute inset-0 bg-amber-400/20 blur-xl group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
                <Crown className="w-6 h-6 relative z-10" />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm md:text-base tracking-widest font-pixel pt-1 text-amber-200">JOUR {day}/20</span>
                    {timeOfDay === 'DAY' ? <Sun className="w-4 h-4 text-yellow-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-blue-200" />}
                </div>
                {/* Day Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(day / 20) * 100}%` }}
                        className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                </div>
            </div>
          </div>
          
          <div className="flex gap-3 md:gap-6 relative">
            {/* Floating Texts Container */}
            <div className="absolute top-10 left-0 w-full h-0 overflow-visible pointer-events-none">
                <AnimatePresence>
                    {floatingTexts.map(ft => (
                        <motion.div
                            key={ft.id}
                            initial={{ opacity: 0, y: 20, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, y: -60, scale: 1.2, rotate: 0 }}
                            exit={{ opacity: 0, y: -100, scale: 0.8, rotate: 10 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`absolute font-pixel font-bold text-2xl drop-shadow-md flex items-center gap-1 ${ft.type === 'gold' ? 'text-yellow-400' : 'text-blue-400'}`}
                            style={{ left: ft.type === 'gold' ? '20px' : '100px' }}
                        >
                            {ft.type === 'gold' ? <Coins className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            {ft.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-transform hover:scale-105">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-pixel text-xs text-yellow-100 pt-1">{gold}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-transform hover:scale-105">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="font-pixel text-xs text-blue-100 pt-1">{population}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[85vh] relative z-10">
        
        {/* Day/Night Transition Overlay */}
        <AnimatePresence>
            {showDayNightTransition && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
                >
                    <div className="text-center">
                        {showDayNightTransition === 'DAY' ? (
                            <>
                                <Sun className="w-32 h-32 text-yellow-400 mx-auto mb-4 animate-spin-slow drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
                                <h2 className="text-4xl font-pixel text-yellow-200 tracking-widest">LE JOUR SE LÈVE</h2>
                            </>
                        ) : (
                            <>
                                <Moon className="w-32 h-32 text-blue-300 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(147,197,253,0.8)]" />
                                <h2 className="text-4xl font-pixel text-blue-200 tracking-widest">LA NUIT TOMBE</h2>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Game Over Overlays */}
        <AnimatePresence>
            {gameState !== 'PLAYING' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-3xl p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-slate-800 p-8 rounded-3xl border-4 border-amber-500/30 text-center max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                        {/* Decorative corners */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500/50 rounded-tl-3xl"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500/50 rounded-tr-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500/50 rounded-bl-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500/50 rounded-br-3xl"></div>

                        {gameState === 'GAME_OVER_LOSS' ? (
                            <>
                                <div className="relative inline-block mb-6">
                                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                                    <Skull className="w-24 h-24 text-red-500 relative z-10" />
                                </div>
                                <h2 className="text-4xl font-pixel text-red-500 mb-4 tracking-widest">GAME OVER</h2>
                                <p className="text-slate-300 mb-8 text-lg font-serif italic">"Votre règne s'achève dans la disgrâce. L'histoire oubliera votre nom."</p>
                            </>
                        ) : (
                            <>
                                <div className="relative inline-block mb-6">
                                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse"></div>
                                    <Trophy className="w-24 h-24 text-yellow-400 relative z-10" />
                                </div>
                                <h2 className="text-4xl font-pixel text-yellow-400 mb-4 tracking-widest">VICTOIRE !</h2>
                                <p className="text-slate-300 mb-8 text-lg font-serif italic">"Vingt jours de prospérité ! Les bardes chanteront vos louanges pour l'éternité."</p>
                            </>
                        )}
                        
                        <button 
                            onClick={restartGame}
                            className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all w-full text-lg shadow-lg hover:shadow-indigo-500/50 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                        >
                            <RotateCcw className="w-6 h-6" />
                            RECOMMENCER
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Log Area */}
        <div className="mb-6 h-20 flex items-center justify-center text-center w-full max-w-2xl">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={lastLog}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/5 shadow-xl"
                >
                    <p className="text-indigo-100 font-medium text-lg md:text-xl font-serif italic tracking-wide">
                        {lastLog}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Card Area - Medieval RPG Style Dialogue Box */}
        <div className="relative w-full max-w-3xl mt-auto mb-6 px-4">
            <AnimatePresence mode="wait">
                {currentVisitor && gameState === 'PLAYING' ? (
                    <VisitorCard 
                        key={currentVisitor.getName() + day} 
                        visitor={currentVisitor} 
                        onDecide={handleDecision} 
                        disabled={interactionDisabled}
                    />
                ) : !currentVisitor && gameState === 'PLAYING' ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#1a1614]/90 backdrop-blur-sm rounded-lg border-[3px] border-[#8b7355] shadow-lg"
                    >
                        <div className="relative">
                            <Crown className="w-8 h-8 text-[#d4af37] animate-pulse" />
                        </div>
                        <p className="text-[#d4af37]/80 font-pixel text-[10px] tracking-widest">EN ATTENTE...</p>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>

      </main>
    </div>
  );
}

const VisitorCard: React.FC<{ 
    visitor: Visitor; 
    onDecide: (d: "YES" | "NO") => void;
    disabled: boolean;
}> = ({ 
    visitor, 
    onDecide, 
    disabled 
}) => {
    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full flex flex-row items-stretch bg-[#1a1614] border-[3px] border-[#8b7355] rounded-lg shadow-[0_0_0_2px_#000000,0_10px_20px_rgba(0,0,0,0.5)] overflow-hidden mx-auto h-[180px]"
        >
            {/* Portrait Area - Left (Compact) */}
            <div className="w-32 md:w-40 bg-[#0c0a09] relative shrink-0 border-r-[3px] border-[#8b7355]">
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#8b7355_1px,transparent_1px)] [background-size:4px_4px]"></div>
                
                {/* Image */}
                <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                    <motion.img 
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        src={visitor.getImageUrl()} 
                        alt={visitor.getName()} 
                        className="w-full h-full object-cover rendering-pixelated"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>

                {/* Name Tag (Overlay) */}
                <div className="absolute bottom-0 left-0 w-full bg-[#1a1614]/95 border-t-[2px] border-[#8b7355] py-1 px-1 text-center">
                    <h2 className="text-[#e5e5e5] font-pixel text-[10px] md:text-xs tracking-wider uppercase truncate">
                        {visitor.getName()}
                    </h2>
                </div>
            </div>

            {/* Dialogue Area - Right */}
            <div className="flex-1 p-4 flex flex-col justify-between relative bg-[#26201d]">
                {/* Text */}
                <div className="relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[#e8dcc5] font-pixel text-xs md:text-sm leading-relaxed tracking-wide drop-shadow-sm">
                        "{visitor.getDescription()}"
                        <motion.span 
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-2 h-4 bg-[#d4af37] ml-1 align-middle"
                        />
                    </p>
                </div>

                {/* Actions (Compact) */}
                <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-[#8b7355]/30">
                    <button 
                        onClick={() => onDecide("NO")}
                        disabled={disabled}
                        className={`
                            group relative py-1.5 px-3 border-[2px] transition-all duration-100 active:translate-y-[1px]
                            ${disabled 
                                ? 'bg-[#2a2320] border-[#4a403a] text-[#5c5048] cursor-not-allowed' 
                                : 'bg-[#3f1212] border-[#802020] text-[#ffcccc] hover:bg-[#5e1b1b] hover:border-[#a02828] shadow-[2px_2px_0px_rgba(0,0,0,0.5)]'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <X className="w-3 h-3" />
                            <span className="font-pixel text-[10px] uppercase">{visitor.getNoLabel()}</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => onDecide("YES")}
                        disabled={disabled}
                        className={`
                            group relative py-1.5 px-3 border-[2px] transition-all duration-100 active:translate-y-[1px]
                            ${disabled 
                                ? 'bg-[#2a2320] border-[#4a403a] text-[#5c5048] cursor-not-allowed' 
                                : 'bg-[#0f2e1b] border-[#1e5c35] text-[#ccffdd] hover:bg-[#164226] hover:border-[#2a804a] shadow-[2px_2px_0px_rgba(0,0,0,0.5)]'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Check className="w-3 h-3" />
                            <span className="font-pixel text-[10px] uppercase">{visitor.getYesLabel()}</span>
                        </div>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
