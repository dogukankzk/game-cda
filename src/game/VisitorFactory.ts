import { Visitor } from "./Visitor";
import { VisitorBuilder } from "./VisitorBuilder";
import { Kingdom } from "./Kingdom";

// --- DATA DEFINITIONS ---

interface VisitorData {
    name: string;
    desc: string;
    type: string;
    seed: string; // For DiceBear image
    yesLabel?: string;
    noLabel?: string;
    cost?: number; // Gold cost
    rewardGold?: number; // Gold reward
    rewardPop?: number; // Pop reward
    costPop?: number; // Pop cost
    chance?: number; // For random outcomes
    successMsg?: string;
    failMsg?: string;
    refuseMsg?: string;
    
    // New Conditions
    minGold?: number;
    minPop?: number;
    requiredTime?: 'DAY' | 'NIGHT';
    requiredFlag?: string;
    forbiddenFlag?: string;
    
    // New Effects
    setFlag?: string;
    removeFlag?: string;
}

const MERCHANTS: VisitorData[] = [
    { name: "Marchand d'Épices", desc: "Des saveurs d'Orient pour votre table ? 50 Or.", type: "merchant", seed: "Spice", cost: 50, rewardPop: 5, requiredTime: 'DAY' },
    { name: "Vendeur de Tapis", desc: "Tapis volants (garantie 1 an). 40 Or.", type: "merchant", seed: "Carpet", cost: 40, rewardPop: 4, requiredTime: 'DAY' },
    { name: "Joaillier Royal", desc: "Un collier pour la reine ? 100 Or.", type: "merchant", seed: "Jewel", cost: 100, rewardPop: 15, minGold: 50, requiredTime: 'DAY' },
    { name: "Forgeron Nain", desc: "Des armes en acier nain. Indestructibles. 80 Or.", type: "merchant", seed: "Dwarf", cost: 80, rewardPop: 10, setFlag: "army_upgraded", successMsg: "L'armée est équipée !" },
    { name: "Marchand d'Esclaves", desc: "J'ai de la main d'oeuvre pas chère... 50 Or pour 20 travailleurs.", type: "merchant", seed: "Slaver", cost: 50, rewardPop: 20, setFlag: "slavery_accepted", successMsg: "La population augmente (honteusement).", refuseMsg: "L'esclavage est interdit ici !" },
    { name: "Architecte", desc: "Rénovons la salle du trône ! 200 Or.", type: "merchant", seed: "Architect", cost: 200, rewardPop: 25, setFlag: "castle_renovated", successMsg: "Le château est magnifique !" },
    { name: "Contrebandier", desc: "Psst... J'ai des marchandises 'tombées du camion'. 20 Or.", type: "merchant", seed: "Smuggler", cost: 20, rewardGold: 60, requiredTime: 'NIGHT', successMsg: "Une bonne affaire...", failMsg: "Pas d'or.", refuseMsg: "Je ne traite pas avec les voleurs." }
];

const MILITARY: VisitorData[] = [
    { name: "Capitaine de la Garde", desc: "Les bandits rôdent. Renforçons les patrouilles. 30 Or.", type: "knight", seed: "Guard", cost: 30, rewardPop: 5, setFlag: "patrols_reinforced" },
    { name: "Chevalier Errant", desc: "Je cherche un seigneur à servir. 50 Or pour mon équipement.", type: "knight", seed: "Errant", cost: 50, rewardPop: 8, setFlag: "hero_recruited", successMsg: "Un nouveau héros rejoint vos rangs !" },
    { name: "Maître d'Armes", desc: "Organisons un tournoi pour le moral ! 100 Or.", type: "knight", seed: "Tournament", cost: 100, rewardPop: 20, requiredTime: 'DAY' },
    { name: "Général", desc: "Le royaume voisin nous insulte ! Déclarons la guerre ! (Coût: 200 Or, Gain: Gloire)", type: "knight", seed: "General", cost: 200, rewardPop: 30, setFlag: "at_war", successMsg: "Victoire ! La gloire est nôtre !", refuseMsg: "La paix avant tout." },
    { name: "Espion", desc: "Je peux infiltrer l'ennemi cette nuit... 50 Or.", type: "knight", seed: "Spy", cost: 50, requiredTime: 'NIGHT', setFlag: "enemy_infiltrated", successMsg: "Infiltration réussie.", refuseMsg: "Pas de méthodes déloyales." }
];

const MAGIC: VisitorData[] = [
    { name: "Sorcière", desc: "Potion de fertilité. 100 Or pour doubler la population.", type: "witch", seed: "Witch", cost: 100, requiredTime: 'NIGHT' },
    { name: "Alchimiste", desc: "Je peux changer le plomb en or... Risqué. 50 Or.", type: "witch", seed: "Alchemist", cost: 50, yesLabel: "Essayer", noLabel: "Refuser", successMsg: "Succès ! De l'or !", failMsg: "Explosion ! Le labo est détruit.", refuseMsg: "Trop dangereux." },
    { name: "Voyante", desc: "Je vois un grand malheur... 30 Or pour l'éviter.", type: "witch", seed: "Seer", cost: 30, yesLabel: "Payer", noLabel: "Ignorer", successMsg: "Le malheur est évité.", failMsg: "Pas d'or.", refuseMsg: "Superstitions !" },
    { name: "Nécromancien", desc: "Je peux lever une armée de morts... pour 10 Citoyens.", type: "witch", seed: "Necro", costPop: 10, rewardGold: 100, yesLabel: "Sacrifier", noLabel: "Bannir", requiredTime: 'NIGHT', setFlag: "undead_army", successMsg: "L'armée des morts pille pour vous !", failMsg: "Pas assez de citoyens.", refuseMsg: "Abomination !" },
    { name: "Fantôme", desc: "Ouuuh... Je hante ce château... Donnez-moi 10 Or pour que je parte.", type: "witch", seed: "Ghost", cost: 10, requiredTime: 'NIGHT', successMsg: "Le fantôme disparaît.", refuseMsg: "Il continuera à hanter les couloirs..." }
];

const COMMONERS: VisitorData[] = [
    { name: "Mendiant", desc: "Une pièce pour manger ? 5 Or.", type: "beggar", seed: "Beggar", cost: 5, rewardPop: 2, yesLabel: "Donner", noLabel: "Chasser" },
    { name: "Fermier", desc: "Sécheresse. 20 Or pour irriguer.", type: "farmer", seed: "Farmer", cost: 20, rewardPop: 10, yesLabel: "Aider", noLabel: "Ignorer", requiredTime: 'DAY' },
    { name: "Réfugiés", desc: "La guerre a détruit notre village. Pouvons-nous entrer ? (-10 Or, +10 Pop)", type: "beggar", seed: "Refugees", cost: 10, rewardPop: 10, yesLabel: "Accueillir", noLabel: "Refuser" },
    { name: "Artiste de Rue", desc: "Un spectacle pour la cour ? 10 Or.", type: "bard", seed: "Artist", cost: 10, rewardPop: 5, yesLabel: "Applaudir", noLabel: "Chasser", requiredTime: 'DAY' },
    { name: "Voleur", desc: "La bourse ou la vie ! (Donner 20 Or ou perdre 5 Pop)", type: "beggar", seed: "Thief", cost: 20, requiredTime: 'NIGHT', yesLabel: "Donner", noLabel: "Résister", successMsg: "Il s'enfuit avec l'or.", failMsg: "Pas d'or...", refuseMsg: "Il blesse des gardes en fuyant (-5 Pop)." }
];

const EVENTS: VisitorData[] = [
    { name: "Messager Royal", desc: "Une peste se propage ! Brûler les quartiers infectés ? (-20 Pop) ou Soigner (-100 Or)", type: "event", seed: "Plague", cost: 100, yesLabel: "Soigner (-100 Or)", noLabel: "Brûler (-20 Pop)", successMsg: "Les médecins ont sauvé la ville.", failMsg: "Pas d'or... On doit brûler.", refuseMsg: "Le feu purifie tout... (-20 Pop)" },
    { name: "Crieur Public", desc: "C'est le festival annuel ! Financer les festivités ? 50 Or.", type: "event", seed: "Festival", cost: 50, rewardPop: 15, yesLabel: "Fête !", noLabel: "Annuler", requiredTime: 'DAY' },
    { name: "Mineur", desc: "Nous avons trouvé un nouveau filon d'or ! Investir 50 Or pour l'exploiter ?", type: "event", seed: "Miner", cost: 50, rewardGold: 150, yesLabel: "Investir", noLabel: "Ignorer", setFlag: "gold_mine" },
    { name: "Ambassadeur", desc: "Le roi voisin propose un traité de paix. (Coût: 0, Gain: +10 Pop)", type: "event", seed: "Diplomat", cost: 0, rewardPop: 10, yesLabel: "Signer", noLabel: "Refuser", setFlag: "peace_treaty" },
    { name: "Loup-Garou", desc: "Aouuuuh ! Un monstre attaque ! (Payer 50 Or de dégâts ou perdre 10 Pop)", type: "event", seed: "Werewolf", cost: 50, requiredTime: 'NIGHT', yesLabel: "Réparer", noLabel: "Laisser faire", successMsg: "Les dégâts sont réparés.", refuseMsg: "Le monstre a dévoré des villageois." }
];

const GAMBLING: VisitorData[] = [
    { name: "Joueur de Dés", desc: "On parie ? 50 Or. Pile je double, face je garde.", type: "jester", seed: "Gambler", cost: 50, yesLabel: "Parier", noLabel: "Refuser" },
    { name: "Maître des Énigmes", desc: "Si vous répondez juste, je vous donne 100 Or. Sinon, vous me donnez 50 Or. (Chance 50%)", type: "jester", seed: "Riddle", cost: 50, yesLabel: "Jouer", noLabel: "Partir" }
];

const RESCUE_EVENTS: VisitorData[] = [
    { name: "Oncle Lointain", desc: "J'ai appris vos difficultés financières. Voici un don de la famille. (+50 Or)", type: "merchant", seed: "Uncle", rewardGold: 50, successMsg: "La famille est sacrée.", refuseMsg: "Je n'ai pas besoin de charité." },
    { name: "Trésor Oublié", desc: "En creusant les fondations, nous avons trouvé un vieux coffre ! (+40 Or)", type: "event", seed: "Chest", rewardGold: 40, successMsg: "Une bénédiction !", refuseMsg: "Laissez-le aux morts." },
    { name: "Collecte Publique", desc: "Le peuple se cotise pour sauver le royaume. (+30 Or)", type: "beggar", seed: "Crowd", rewardGold: 30, successMsg: "Le peuple est loyal.", refuseMsg: "Je ne prendrai pas leur argent." },
    { name: "Vieux Sage", desc: "Tenez, prenez cette bourse. L'avenir du royaume en dépend. (+60 Or)", type: "witch", seed: "Sage", rewardGold: 60, successMsg: "Merci, sage.", refuseMsg: "Gardez votre or." }
];

// --- FACTORY ---

export class VisitorFactory {
  // History to prevent immediate repetition
  private static recentVisitors: string[] = [];
  private static readonly MAX_HISTORY = 5;

  public static createVisitor(kingdom: Kingdom, timeOfDay: 'DAY' | 'NIGHT'): Visitor {
    const builder = new VisitorBuilder();
    
    // 0. Rescue Mechanism (Low Gold)
    // If gold is critical (< 20), 40% chance to trigger a rescue event
    if (kingdom.getGold() < 20 && Math.random() < 0.4) {
        const data = RESCUE_EVENTS[Math.floor(Math.random() * RESCUE_EVENTS.length)];
        return this.buildVisitorFromData(builder, data);
    }

    // 1. Filter valid visitors based on conditions
    const allCategories = [MERCHANTS, MILITARY, MAGIC, COMMONERS, EVENTS, GAMBLING];
    let validVisitors: VisitorData[] = [];

    for (const category of allCategories) {
        for (const data of category) {
            // Check Time
            if (data.requiredTime && data.requiredTime !== timeOfDay) continue;
            
            // Check Flags
            if (data.requiredFlag && !kingdom.hasFlag(data.requiredFlag)) continue;
            if (data.forbiddenFlag && kingdom.hasFlag(data.forbiddenFlag)) continue;

            // Check Resources (Soft check, allow seeing them even if poor, but maybe filter extreme cases)
            // if (data.minGold && kingdom.getGold() < data.minGold) continue;

            // Check History
            if (this.recentVisitors.includes(data.name)) continue;

            validVisitors.push(data);
        }
    }

    // Fallback if no valid visitors (should rarely happen)
    if (validVisitors.length === 0) {
        this.recentVisitors = []; // Reset history
        return this.createVisitor(kingdom, timeOfDay); // Retry
    }

    // 2. Select Weighted Random
    // For simplicity, uniform random among valid ones for now, or we can re-implement category weighting
    const data = validVisitors[Math.floor(Math.random() * validVisitors.length)];

    // Update History
    this.recentVisitors.push(data.name);
    if (this.recentVisitors.length > this.MAX_HISTORY) {
        this.recentVisitors.shift();
    }

    return this.buildVisitorFromData(builder, data);
  }

  private static buildVisitorFromData(builder: VisitorBuilder, data: VisitorData): Visitor {
    return builder
        .setName(data.name)
        .setDescription(data.desc)
        .setType(data.type)
        .setImageUrl(`https://api.dicebear.com/9.x/pixel-art/svg?seed=${data.seed}`)
        .setButtons(data.yesLabel || "Accepter", data.noLabel || "Refuser")
        .setEffects(
            (k) => {
                // Special Logic
                if (data.name === "Messager Royal") { // Plague logic
                    if (k.getGold() >= 100) {
                        k.modifyGold(-100);
                        return data.successMsg || "Sauvés !";
                    } else {
                        k.modifyPopulation(-20);
                        return "Pas assez d'or... Le feu a dû être utilisé.";
                    }
                }

                if (data.name === "Alchimiste") {
                    if (k.getGold() < 50) return "Pas assez d'or pour l'expérience.";
                    k.modifyGold(-50);
                    if (Math.random() > 0.5) {
                        k.modifyGold(200);
                        return data.successMsg || "Or !";
                    } else {
                        k.modifyPopulation(-10);
                        return data.failMsg || "Boum !";
                    }
                }

                if (data.name === "Joueur de Dés" || data.name === "Maître des Énigmes") {
                    const bet = data.cost || 50;
                    if (k.getGold() < bet) return "Pas assez d'or pour jouer.";
                    
                    if (Math.random() > 0.5) {
                        k.modifyGold(bet * 2); 
                        return data.successMsg || "Gagné !";
                    } else {
                        k.modifyGold(-bet);
                        return data.failMsg || "Perdu...";
                    }
                }
                
                if (data.name === "Voleur") {
                     if (k.getGold() < 20) return data.failMsg || "Rien à voler...";
                     k.modifyGold(-20);
                     return data.successMsg || "Volé !";
                }
                
                if (data.name === "Loup-Garou") {
                    if (k.getGold() < 50) return "Pas assez d'or pour réparer.";
                    k.modifyGold(-50);
                    return data.successMsg || "Réparé.";
                }

                if (data.name === "Nécromancien") {
                    if (k.getPopulation() < 10) return "Pas assez de citoyens.";
                    k.modifyPopulation(-10);
                    k.modifyGold(100);
                    if (data.setFlag) k.addFlag(data.setFlag);
                    return data.successMsg || "L'armée des morts rapporte de l'or.";
                }
                
                if (data.name === "Sorcière" && data.cost === 100) { // Double pop
                     if (k.getGold() < 100) return "Pas assez d'or.";
                     k.modifyGold(-100);
                     k.modifyPopulation(k.getPopulation()); // Double it (add current amount)
                     return data.successMsg || "Population doublée !";
                }

                // Standard Logic
                if (data.cost && k.getGold() < data.cost) {
                    return "Pas assez d'or pour accepter cette offre.";
                }

                if (data.cost) k.modifyGold(-data.cost);
                if (data.costPop) k.modifyPopulation(-data.costPop);
                if (data.rewardGold) k.modifyGold(data.rewardGold);
                if (data.rewardPop) k.modifyPopulation(data.rewardPop);
                
                // Flags
                if (data.setFlag) k.addFlag(data.setFlag);
                if (data.removeFlag) k.removeFlag(data.removeFlag);

                return data.successMsg || "Marché conclu.";
            },
            (k) => {
                // Refusal Logic
                if (data.name === "Messager Royal") { // Plague refuse -> burn
                    k.modifyPopulation(-20);
                    return data.refuseMsg || "Le feu purifie...";
                }
                
                if (data.name === "Voleur") {
                    k.modifyPopulation(-5);
                    return data.refuseMsg || "Aïe !";
                }
                
                if (data.name === "Loup-Garou") {
                    k.modifyPopulation(-10);
                    return data.refuseMsg || "Massacre...";
                }
                
                return data.refuseMsg || "Vous refusez l'offre.";
            }
        )
        .buildGeneric();
  }
  
  // Keep the old method for compatibility if needed, but redirect
  public static createRandomVisitor(): Visitor {
      // Create a dummy kingdom for fallback if this is called without context
      // Ideally we shouldn't use this anymore
      return this.createVisitor(new Kingdom(0,0), 'DAY');
  }
}
