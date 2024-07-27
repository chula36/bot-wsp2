import { addKeyword, Flow } from "@builderbot/bot";

const flowCancel: Flow = addKeyword('cancelar cita')
    .addAnswer('Aquí puedes cancelar tu cita.');

export default flowCancel;
