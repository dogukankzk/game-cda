import { Kingdom } from "./Kingdom";

export type Decision = "YES" | "NO";

export abstract class Visitor {
  protected name: string;
  protected description: string;
  protected characterType: string;
  protected imageUrl: string;
  protected yesLabel: string;
  protected noLabel: string;

  constructor(name: string, description: string, characterType: string, imageUrl: string, yesLabel: string = "Accepter", noLabel: string = "Refuser") {
    this.name = name;
    this.description = description;
    this.characterType = characterType;
    this.imageUrl = imageUrl;
    this.yesLabel = yesLabel;
    this.noLabel = noLabel;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCharacterType(): string {
    return this.characterType;
  }

  public getImageUrl(): string {
    return this.imageUrl;
  }

  public getYesLabel(): string {
    return this.yesLabel;
  }

  public getNoLabel(): string {
    return this.noLabel;
  }

  // Abstract method for polymorphism
  public abstract applyEffect(decision: Decision, kingdom: Kingdom): string;
}

// Concrete Visitor: Merchant
export class Merchant extends Visitor {
  constructor(name: string = "Marchand Voyageur", description: string = "J'ai des épices exotiques. Voulez-vous les acheter pour 50 Or ?", imageUrl: string = "https://api.dicebear.com/9.x/pixel-art/svg?seed=Merchant") {
    super(name, description, "merchant", imageUrl, "Acheter", "Refuser");
  }

  public applyEffect(decision: Decision, kingdom: Kingdom): string {
    if (decision === "YES") {
      if (kingdom.getGold() >= 50) {
        kingdom.modifyGold(-50);
        kingdom.modifyPopulation(5); // Happy population
        return "Le marchand a vendu ses marchandises. Le peuple est ravi des nouvelles épices.";
      } else {
        return "Vous n'avez pas les moyens. Le marchand repart déçu.";
      }
    } else {
      return "Vous avez renvoyé le marchand.";
    }
  }
}

// Concrete Visitor: Knight
export class Knight extends Visitor {
  constructor(name: string = "Chevalier Royal", description: string = "Mon armure est rouillée. J'ai besoin de 20 Or pour les réparations afin de protéger le royaume.", imageUrl: string = "https://api.dicebear.com/9.x/pixel-art/svg?seed=Knight") {
    super(name, description, "knight", imageUrl, "Financer", "Refuser");
  }

  public applyEffect(decision: Decision, kingdom: Kingdom): string {
    if (decision === "YES") {
      if (kingdom.getGold() >= 20) {
        kingdom.modifyGold(-20);
        kingdom.modifyPopulation(2); // Safety increases morale
        return "Le chevalier répare son armure et patrouille dans les rues.";
      } else {
        return "Le chevalier ne peut pas réparer son armure. Il grommelle à propos de la sécurité.";
      }
    } else {
      kingdom.modifyPopulation(-5); // People feel unsafe
      return "Le chevalier part. Le peuple se sent moins en sécurité.";
    }
  }
}

// Concrete Visitor: Witch
export class Witch extends Visitor {
  constructor(name: string = "Sorcière des Marais", description: string = "Je peux concocter une potion pour doubler votre population, mais cela coûte 100 Or.", imageUrl: string = "https://api.dicebear.com/9.x/pixel-art/svg?seed=Witch") {
    super(name, description, "witch", imageUrl, "Accepter le pacte", "Chasser");
  }

  public applyEffect(decision: Decision, kingdom: Kingdom): string {
    if (decision === "YES") {
      if (kingdom.getGold() >= 100) {
        kingdom.modifyGold(-100);
        const currentPop = kingdom.getPopulation();
        kingdom.modifyPopulation(currentPop); // Doubles population (add current amount)
        return "La potion fonctionne ! Une explosion magique augmente la population.";
      } else {
        kingdom.modifyPopulation(-10); // Curse for wasting time
        return "Vous ne pouvez pas payer ? La sorcière maudit les récoltes ! Les gens partent.";
      }
    } else {
      return "Vous déclinez sagement (ou follement) l'offre de la sorcière.";
    }
  }
}

// Concrete Visitor: Beggar
export class Beggar extends Visitor {
    constructor(name: string = "Mendiant Pauvre", description: string = "Une aumône pour un pauvre ? Juste 5 or.", imageUrl: string = "https://api.dicebear.com/9.x/pixel-art/svg?seed=Beggar") {
        super(name, description, "beggar", imageUrl, "Donner", "Ignorer");
    }

    public applyEffect(decision: Decision, kingdom: Kingdom): string {
        if (decision === "YES") {
            if (kingdom.getGold() >= 5) {
                kingdom.modifyGold(-5);
                kingdom.modifyPopulation(1);
                return "Le mendiant vous bénit.";
            } else {
                return "Vous n'avez pas d'or à donner.";
            }
        } else {
            kingdom.modifyPopulation(-2);
            return "Le mendiant part en répandant des rumeurs sur votre avarice.";
        }
    }
}

// Concrete Visitor: TaxCollector
export class TaxCollector extends Visitor {
    constructor(name: string = "Collecteur d'Impôts", description: string = "Devons-nous collecter les impôts du peuple ? (+50 Or, -10 Pop)", imageUrl: string = "https://api.dicebear.com/9.x/pixel-art/svg?seed=Tax") {
        super(name, description, "tax_collector", imageUrl, "Collecter", "Épargner");
    }

    public applyEffect(decision: Decision, kingdom: Kingdom): string {
        if (decision === "YES") {
            kingdom.modifyGold(50);
            kingdom.modifyPopulation(-10);
            return "Impôts collectés. Le trésor grandit, mais le peuple grogne.";
        } else {
            kingdom.modifyPopulation(5);
            return "Vous avez épargné les impôts au peuple aujourd'hui. Ils se réjouissent.";
        }
    }
}

// Generic Visitor for Builder Pattern flexibility
export class GenericVisitor extends Visitor {
    private onYes: (k: Kingdom) => string;
    private onNo: (k: Kingdom) => string;

    constructor(name: string, description: string, type: string, imageUrl: string, onYes: (k: Kingdom) => string, onNo: (k: Kingdom) => string, yesLabel: string = "Accepter", noLabel: string = "Refuser") {
        super(name, description, type, imageUrl, yesLabel, noLabel);
        this.onYes = onYes;
        this.onNo = onNo;
    }

    public applyEffect(decision: Decision, kingdom: Kingdom): string {
        if (decision === "YES") {
            return this.onYes(kingdom);
        } else {
            return this.onNo(kingdom);
        }
    }
}
