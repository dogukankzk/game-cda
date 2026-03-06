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

// --- FACTORY ---

export class VisitorFactory {
  // History to prevent immediate repetition
  private static recentVisitors: string[] = [];
  private static readonly MAX_HISTORY = 5;
  private static externalEvents: VisitorData[] = [];

  public static addExternalEvents(events: VisitorData[]) {
      this.externalEvents = events;
  }

  public static createVisitor(kingdom: Kingdom, timeOfDay: 'DAY' | 'NIGHT'): Visitor {
    const builder = new VisitorBuilder();
    
    // 0. Rescue Mechanism (Low Gold)
    // Filter rescue events from external list
    const rescueEvents = this.externalEvents.filter(e => e.type === 'rescue');
    
    if (rescueEvents.length > 0 && kingdom.getGold() < 20 && Math.random() < 0.4) {
        const data = rescueEvents[Math.floor(Math.random() * rescueEvents.length)];
        return this.buildVisitorFromData(builder, data);
    }

    // 1. Filter valid visitors based on conditions
    // We only use externalEvents now
    const allCategories = [this.externalEvents]; 
    
    let validVisitors: VisitorData[] = [];

    for (const category of allCategories) {
        for (const data of category) {
            // Check Time
            if (data.requiredTime && data.requiredTime !== timeOfDay) continue;
            
            // Check Flags
            if (data.requiredFlag && !kingdom.hasFlag(data.requiredFlag)) continue;
            if (data.forbiddenFlag && kingdom.hasFlag(data.forbiddenFlag)) continue;

            // Check History
            if (this.recentVisitors.includes(data.name)) continue;

            validVisitors.push(data);
        }
    }

    // Fallback if no valid visitors
    if (validVisitors.length === 0) {
        // If we have history, try clearing it first
        if (this.recentVisitors.length > 0) {
            this.recentVisitors = []; 
            return this.createVisitor(kingdom, timeOfDay);
        }
        
        // If still no visitors (e.g. DB not loaded yet), return a placeholder
        return builder
            .setName("...")
            .setDescription("Le royaume est calme. Trop calme...")
            .setType("commoner")
            .setImageUrl(`https://api.dicebear.com/9.x/pixel-art/svg?seed=Quiet`)
            .setButtons("Attendre", "Dormir")
            .setEffects(() => "Rien ne se passe.", () => "Zzz...")
            .buildGeneric();
    }

    // 2. Select Weighted Random
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
                // Generic Data-Driven Logic
                
                // 1. Check Costs
                if (data.cost && k.getGold() < data.cost) {
                    return "Pas assez d'or pour accepter cette offre.";
                }
                if (data.costPop && k.getPopulation() < data.costPop) {
                    return "Pas assez de population pour accepter cette offre.";
                }

                // 2. Pay Costs
                if (data.cost) k.modifyGold(-data.cost);
                if (data.costPop) k.modifyPopulation(-data.costPop);

                // 3. Determine Outcome (Chance)
                let success = true;
                if (data.chance !== undefined && data.chance !== null) {
                    success = Math.random() < data.chance;
                }

                if (success) {
                    // 4. Apply Rewards
                    if (data.rewardGold) k.modifyGold(data.rewardGold);
                    if (data.rewardPop) k.modifyPopulation(data.rewardPop);
                    
                    // 5. Apply Flags
                    if (data.setFlag) k.addFlag(data.setFlag);
                    if (data.removeFlag) k.removeFlag(data.removeFlag);

                    return data.successMsg || "Marché conclu.";
                } else {
                    // Failure Outcome
                    // (Costs are already paid)
                    return data.failMsg || "Cela n'a pas fonctionné...";
                }
            },
            (k) => {
                // Refusal Logic
                // Currently no side effects for refusal in generic model, just message.
                // If we wanted 'refuse penalty', we'd need a field for it.
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
