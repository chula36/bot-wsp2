// index.ts
import { createFlow } from "@builderbot/bot";
import { flowConfirm } from "./confirm.flow";
import { flowSchedule } from "./schedule.flow";
import { flowSeller } from "./seller.flow";

// Asegúrate de que las variables estén inicializadas antes de usarlas
const flows = createFlow([flowSeller, flowSchedule, flowConfirm]);

export default flows;
