import {
  EntityComponentTypes,
  HudElement,
  HudVisibility,
  ItemComponentTypes,
  ItemStack,
  Player,
  system,
  world,
} from "@minecraft/server";
import { vanilla_food } from "./const/vanilla";

class LegacyHunger {
  constructor() {
    world.afterEvents.playerSpawn.subscribe(({ player }) => {
      player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [HudElement.Hunger]);
    });

    system.runInterval(() => {
      world.getPlayers().forEach((player) => {
        this.resetHunger(player);
      });
    });

    world.afterEvents.itemCompleteUse.subscribe(({ itemStack, source: player }) => {
      const health = player.getComponent(EntityComponentTypes.Health);
      if (!health) return;

      const heal = this.getHealingValue(itemStack);

      health.setCurrentValue(Math.min(health.currentValue + heal, health.effectiveMax));
    });

    world.afterEvents.effectAdd.subscribe(({ entity, effect }) => {
      console.log(effect.typeId);
      if (effect.typeId !== "hunger") return;
      entity.addEffect("nausea", effect.duration, { amplifier: effect.amplifier });
      entity.removeEffect("hunger");
    });
  }

  private getHealingValue(itemStack: ItemStack): number {
    const vanillaFood = vanilla_food.find((v) => itemStack.typeId === v.typeId);
    if (vanillaFood) {
      return vanillaFood.nutrition;
    } else {
      const food = itemStack.getComponent(ItemComponentTypes.Food);
      if (food) return food.nutrition;
      else return 0;
    }
  }

  private resetHunger(player: Player) {
    const hunger = player.getComponent(EntityComponentTypes.Hunger);
    const saturation = player.getComponent(EntityComponentTypes.Saturation);
    if (!hunger) return;
    if (!saturation) return;
    hunger.setCurrentValue(10);
    saturation.resetToMinValue();
  }
}

new LegacyHunger();
