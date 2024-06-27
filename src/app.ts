import { join } from 'path';
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

const PORT = process.env.PORT ?? 3008;

// Función para manejar respuestas incorrectas
const handleFallback = (option) => {
    return `Disculpa, no entendí tu respuesta. Por favor, puedes responder a esto:\n${option}`;
};

// Flujo principal que incluye el saludo inicial y las opciones de menú
const welcomeFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola', 'buen día', 'buenas tardes', 'buenas noches'])
    .addAnswer('🤖 Hola Bienvenid@ al *Asistente Virtual* del *Dr. Rubio*')
    .addAnswer(
        [
            'Gracias por tu mensaje.',
            'Para empezar, ¿podrías decirme tu nombre?'
        ].join('\n'),
        { capture: true },
        async (ctx, { state, flowDynamic }) => {
            const userName = ctx.body; // Obtener el nombre del contexto actual
            await state.update({ name: userName }); // Guardar el nombre en el estado
            await flowDynamic(`¡Hola ${userName}! ¿En qué puedo ayudarte hoy?`);
        }
    )
    .addAnswer(
        [
            '👉 Elige uno de nuestros servicios:',
            '1. *Consulta Online* 💻',
            '2. *Consulta Presencial* 🏥',
            '3. *Servicios Disponibles* 🛠️',
            '4. *Agente en Vivo* 🧑‍💼'
        ].join('\n'),
        { delay: 800, capture: true },
        async (ctx, { flowDynamic, state }) => {
            const message = ctx.body.toLocaleLowerCase().trim();
            if (message === '1' || message === 'consulta online') {
                await flowDynamic(
                    `Has elegido la opción de *Consulta Online* 💻.\n` +
                    `Podemos ayudarte con consultas médicas a través de videoconferencia. ` +
                    `Esta opción es ideal para resolver dudas y recibir orientación médica desde la comodidad de tu hogar.\n\n` +
                    `¿Te gustaría comenzar con una consulta online ahora?`
                );
            } else if (message === '2' || message === 'consulta presencial') {
                await flowDynamic(
                    `Has elegido la opción de *Consulta Presencial* 🏥.\n` +
                    `Te invitamos a programar una cita en nuestra clínica para una evaluación médica en persona.\n\n` +
                    `¿Deseas agendar una consulta presencial con nosotros?`
                );
            } else if (message === '3' || message === 'servicios disponibles') {
                await flowDynamic(
                    `Has elegido la opción de *Servicios Disponibles* 🛠️.\n` +
                    `Ofrecemos una variedad de servicios de cirugía estética que incluyen liposucción, rinoplastia, y rejuvenecimiento facial, entre otros.\n\n` +
                    `¿Te gustaría saber más sobre algún servicio en particular?`
                );
            } else if (message === '4' || message === 'agente en vivo') {
                await flowDynamic(
                    `Estoy conectándote con un agente en línea 🧑‍💼.\n` +
                    `Puedes hacer preguntas sobre nuestros servicios, horarios disponibles, y cualquier otra información que necesites.\n\n` +
                    `¿En qué más puedo asistirte hoy?`
                );
            } else {
                await flowDynamic(handleFallback(
                    '1. *Consulta Online*\n2. *Consulta Presencial*\n3. *Servicios Disponibles*\n4. *Agente en Vivo*'
                ));
            }
        }
    );

const registerFlow = addKeyword<Provider, Database>(utils.setEvent('REGISTER_FLOW'))
    .addAnswer('¿Cuál es tu nombre?', { capture: true }, async (ctx, { state, flowDynamic }) => {
        const userName = ctx.body; // Obtener el nombre del contexto actual
        await state.update({ name: userName }); // Guardar el nombre en el estado
        await flowDynamic(`¡Hola ${userName}! ¿En qué puedo ayudarte hoy?`);
    });

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, registerFlow]);
    
    const adapterProvider = createProvider(Provider);
    const adapterDB = new Database();

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body;
            await bot.sendMessage(number, message, { media: urlMedia ?? null });
            return res.end('Mensaje enviado.');
        })
    );

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body;
            await bot.dispatch('REGISTER_FLOW', { from: number, name });
            return res.end('Evento de registro activado.');
        })
    );

    httpServer(+PORT);
};

main();
