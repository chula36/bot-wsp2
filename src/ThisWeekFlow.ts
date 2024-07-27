import { addKeyword } from '@builderbot/bot';

const thisWeekFlow = addKeyword(['this week', 'esta semana'])
    .addAction(async (ctx, { flowDynamic }) => {
        await flowDynamic('¡Bienvenido a This Week Flow!');
        await flowDynamic('Has llegado al flujo para agendar citas de esta semana.');
    });

export default thisWeekFlow;
