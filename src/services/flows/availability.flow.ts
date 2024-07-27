import { addKeyword, Flow } from "@builderbot/bot";

const flowAvailability: Flow = addKeyword('consultar disponibilidad')
    .addAnswer('Aquí puedes consultar la disponibilidad de citas.');

export default flowAvailability;
