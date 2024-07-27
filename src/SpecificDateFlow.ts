import { addKeyword } from '@builderbot/bot';

const specificDateFlow = addKeyword(['specific date', 'fecha específica'])
    .addAction(async (ctx, { flowDynamic }) => {
        await flowDynamic('¡Bienvenido a Specific Date Flow!');
        await flowDynamic('Has llegado al flujo para agendar citas para una fecha específica.');
    });

export default specificDateFlow;
