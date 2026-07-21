import DrugInteraction from "../../schemas/interactions/drugInteractionSchema.js";
import { drugInteractionSeedData } from "./drugInteractionSeedData.js";
import { Op } from "sequelize";

export const seedDrugInteractions = async () => {
  for (const interaction of drugInteractionSeedData) {
    const existingInteraction = await DrugInteraction.findOne({
      where: {
        [Op.or]: [
          {
            drugARxcui: interaction.drugARxcui,
            drugBRxcui: interaction.drugBRxcui,
          },
          {
            drugARxcui: interaction.drugBRxcui,
            drugBRxcui: interaction.drugARxcui,
          },
        ],
      },
    });

    if (!existingInteraction) {
      await DrugInteraction.create(interaction);
    }
  }
};
