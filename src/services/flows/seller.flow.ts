// seller.flow.ts

import { addKeyword, Flow, EVENTS } from "@builderbot/bot";
import conversationalLayer from "../layers/conversational.layer";


const sellerPrompt = `¿En qué producto o servicio estás interesado/a?`;

export const flowSeller: Flow = addKeyword(EVENTS.ACTION)
    .addAnswer(`⏱️`)
    .addAction(conversationalLayer)

    .addAction(async (ctx, { state, flowDynamic }) => {
        await flowDynamic([{ body: sellerPrompt }]);
    });

export default flowSeller;
