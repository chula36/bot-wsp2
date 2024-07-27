// confirm.flow.ts

import { addKeyword, Flow, EVENTS } from "@builderbot/bot";
import conversationalLayer from "../layers/conversational.layer";
import mainLayer from "../layers/main.layer";

const confirmPrompt = `Perfecto, la cita ha sido agendada. ¿Hay algo más en lo que pueda ayudarte?`;

export const flowConfirm: Flow = addKeyword(EVENTS.ACTION)
    .addAnswer(`⏱️`)
    .addAction(conversationalLayer)
    .addAction(mainLayer)
    .addAction(async (ctx, { state, flowDynamic }) => {
        await flowDynamic([{ body: confirmPrompt }]);
    });

export default flowConfirm;
