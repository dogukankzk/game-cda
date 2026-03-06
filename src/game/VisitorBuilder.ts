import { Visitor, Merchant, Knight, Witch, Beggar, TaxCollector, GenericVisitor } from "./Visitor";
import { Kingdom } from "./Kingdom";

// Builder Pattern
export class VisitorBuilder {
  private name: string = "Inconnu";
  private description: string = "...";
  private type: string = "unknown";
  private imageUrl: string = "https://api.dicebear.com/9.x/pixel-art/svg?seed=Unknown";
  private yesLabel: string = "Accepter";
  private noLabel: string = "Refuser";
  
  // Optional: Strategy for GenericVisitor
  private onYes: ((k: Kingdom) => string) | null = null;
  private onNo: ((k: Kingdom) => string) | null = null;

  public setName(name: string): VisitorBuilder {
    this.name = name;
    return this;
  }

  public setDescription(desc: string): VisitorBuilder {
    this.description = desc;
    return this;
  }

  public setType(type: string): VisitorBuilder {
    this.type = type;
    return this;
  }

  public setImageUrl(url: string): VisitorBuilder {
    this.imageUrl = url;
    return this;
  }

  public setButtons(yes: string, no: string): VisitorBuilder {
    this.yesLabel = yes;
    this.noLabel = no;
    return this;
  }

  public setEffects(onYes: (k: Kingdom) => string, onNo: (k: Kingdom) => string): VisitorBuilder {
    this.onYes = onYes;
    this.onNo = onNo;
    return this;
  }

  public buildMerchant(): Merchant {
    return new Merchant(this.name, this.description, this.imageUrl);
  }

  public buildKnight(): Knight {
    return new Knight(this.name, this.description, this.imageUrl);
  }

  public buildWitch(): Witch {
    return new Witch(this.name, this.description, this.imageUrl);
  }

  public buildGeneric(): GenericVisitor {
    if (!this.onYes || !this.onNo) {
        throw new Error("Effects must be set for GenericVisitor");
    }
    return new GenericVisitor(this.name, this.description, this.type, this.imageUrl, this.onYes, this.onNo, this.yesLabel, this.noLabel);
  }
}
