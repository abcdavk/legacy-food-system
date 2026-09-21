import {
  Effect,
  Entity,
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
    system.runInterval(() => {
      world.getPlayers().forEach((player) => {
        this.resetHunger(player);
      });
    }, 4);

    world.afterEvents.playerSpawn.subscribe(({ player }) => {
      player.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [HudElement.Hunger]);
    });

    world.afterEvents.itemCompleteUse.subscribe(({ itemStack, source: player }) => {
      const heal = this.getHealingValue(itemStack);

      this.healPlayer(player, heal);
    });

    world.afterEvents.effectAdd.subscribe(({ entity, effect }) => {
      this.hungerToNausea(entity, effect);
    });

    world.beforeEvents.playerInteractWithBlock.subscribe(({ block, player }) => {
      const hunger = player.getComponent(EntityComponentTypes.Hunger);
      if (!hunger) return;
      system.run(() => {
        const hungerDelta = hunger.currentValue - 10;
        if (hungerDelta <= 0) return;

        this.healPlayer(player, hungerDelta);
        system.run(() => this.resetHunger(player));
      });
    });
  }

  private healPlayer(player: Player, value: number) {
    const health = player.getComponent(EntityComponentTypes.Health);
    if (!health) return;
    health.setCurrentValue(Math.min(health.currentValue + value, health.effectiveMax));
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

  private hungerToNausea(entity: Entity, effect: Effect) {
    if (effect.typeId !== "minecraft:hunger") return;
    entity.addEffect("minecraft:nausea", effect.duration, { amplifier: effect.amplifier });
    entity.removeEffect("minecraft:hunger");
  }
}

new LegacyHunger();
