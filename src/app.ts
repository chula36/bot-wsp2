import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import fetch from 'node-fetch';
import axios from 'axios'; // Asegúrate de tener axios instalado para hacer solicitudes HTTP
const MAKE_GET_FROM_CALENDAR = 'https://hook.us1.make.com/ii3qehn2pclx4c0pc83o7kl82pjmmlqc';


const PORT = process.env.PORT ?? 3008;





// Flujo para manejar la opción de servicios
const serviciosFlow = addKeyword<Provider, Database>(['servicios', '2'])
    .addAnswer(
        'Ofrecemos una variedad de servicios para satisfacer tus necesidades:\n' +
        '1. *Cirugía de Cara* 💆‍♂️\n' +
        '2. *Cirugía de Cuerpo* 🏋️‍♀️\n' +
        '3. *Cirugía de Mamas* 💃\n' +
        '4. *Post Operatorio* 🛌\n' +
        '¿En qué servicio estás interesado?'
    )
    .addAction(async (ctx, { flowDynamic }) => {
        const choice = ctx.body.toLowerCase();

        switch (choice) {
            case '1':
                await flowDynamic(
                    'Has seleccionado *Cirugía de Cara* 💆‍♂️.\n' +
                    'Este servicio se enfoca en mejorar aspectos estéticos del rostro. ' +
                    'Para más información, puedes visitar nuestro [sitio web](https://ejemplo.com/cirugia-de-cara).'
                );
                break;
            case '2':
                await flowDynamic(
                    'Has seleccionado *Cirugía de Cuerpo* 🏋️‍♀️.\n' +
                    'Este servicio está diseñado para modificar y mejorar la forma del cuerpo. ' +
                    'Para más información, puedes visitar nuestro [sitio web](https://ejemplo.com/cirugia-de-cuerpo).'
                );
                break;
            case '3':
                await flowDynamic(
                    'Has seleccionado *Cirugía de Mamas* 💃.\n' +
                    'Este servicio incluye intervenciones para mejorar la estética de las mamas. ' +
                    'Para más información, puedes visitar nuestro [sitio web](https://ejemplo.com/cirugia-de-mamas).'
                );
                break;
            case '4':
                await flowDynamic(
                    'Has seleccionado *Post Operatorio* 🛌.\n' +
                    'Este servicio comprende el cuidado y seguimiento después de una intervención quirúrgica. ' +
                    'Para más información, puedes visitar nuestro [sitio web](https://ejemplo.com/post-operatorio).'
                );
                break;
            default:
                // Si la opción no es válida, no mostramos el menú completo de nuevo, solo el mensaje de error
                await flowDynamic('No seleccionaste una opción válida. Por favor, elige una opción del menú.');
                return; // Salir del flujo sin volver a mostrar el menú
        }
    });

export { serviciosFlow };

// Flujo para manejar la opción de agente en vivo
const agenteEnVivoFlow = addKeyword<Provider, Database>(['agente en vivo'])
    .addAnswer(
        'Un agente estará disponible pronto para atenderte en vivo. Gracias por tu paciencia.'
    );



const welcomeFlow = addKeyword<Provider, Database>(['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'que tal'])
    .addAnswer('👋 ¡Hola! ¿Cómo estás? 😊')
    .addAnswer('Gracias por llegar al asistente virtual. Estoy aquí para ayudarte en lo que necesites.')
    .addAnswer('Antes de comenzar, ¿me dirías tu nombre?', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
        const userName = ctx.body;

        // Validar el nombre utilizando una expresión regular simple
        const nameRegex = /^[a-zA-Z\s]+$/;

        if (!nameRegex.test(userName)) {
            // Si el nombre no es válido, pedir nuevamente el nombre
            await flowDynamic('Parece que tu respuesta no es un nombre válido. Por favor, dime tu nombre para continuar.');
            return; // Terminar la acción aquí para que el flujo no continúe
        }

        // Si el nombre es válido, continuar con el flujo
        await state.update({ name: userName });
        await showMainMenu(flowDynamic, userName); // Función para mostrar el menú principal
    });

// Función para mostrar el menú principal
const showMainMenu = async (flowDynamic: any, userName: string) => {
    await flowDynamic(`Genial, ${userName}, un gusto hablar contigo. Por favor, elige una opción para comenzar.`);
    await flowDynamic(
        [
            '👉 Elige una opción:',
            '1. *Agenda Cita* 📅',
            '2. *Servicios* 📋',
            '3. *Agente en Vivo* 🧑‍💼'
        ].join('\n')
    );
};

    



// Flujo principal para agendar citas
const agendaCitaFlow = addKeyword(['agenda cita', 'cita'])
    .addAnswer('📅 Vamos a programar tu cita.')
    .addAnswer([
        '¿Quieres ver las citas disponibles para esta semana o una fecha específica?',
        '👉 Elige una opción:',
        'a. *Esta semana*',
        'b. *Fecha específica*'
    ].join('\n'), { capture: true })
    .addAction(handleInitialChoice);

// Flujo para "Esta semana"
const estaSemanaFlow = addKeyword(['esta semana'])
    .addAnswer('Responde con el número de la opción que prefieres (por ejemplo, 1, 2, 3) para agendar la cita.', { capture: true })
    .addAction(handleWeeklyChoice)
    .addAnswer('Por favor, confirma la cita escribiendo sí o no.', { capture: true })
    .addAction(handleConfirmation)
    .addAnswer('¿Qué tipo de consulta prefieres?\n1. Online\n2. Presencial', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            const message = ctx.body.trim().toLowerCase();
            const awaitingAdditionalInfo = state.get('awaitingAdditionalInfo');




            if (awaitingAdditionalInfo) {
                if (message.includes('online') || message === '1') {
                    await flowDynamic('Has elegido una consulta online.');
                    await state.update({ consultaType: 'online', awaitingLocation: true });
                } else if (message.includes('presencial') || message === '2') {
                    await flowDynamic('Has elegido una consulta presencial.');
                    await state.update({ consultaType: 'presencial', awaitingLocation: true });
                } else {
                    await flowDynamic('Disculpa, no entendí tu respuesta. Por favor, elige entre 1 (Online) o 2 (Presencial) para el tipo de consulta.');
                }
            }
        } catch (error) {
            console.error('Error al procesar la respuesta del usuario:', error);
            await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
        }
    })
    .addAnswer('¿Dónde quieres tener tu cita?\n1. Santiago de Chile\n2. Talca\n3. Online', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            const message = ctx.body.trim().toLowerCase();
            let location = '';
            if (message.includes('santiago de chile') || message === '1') {
                location = 'Santiago de Chile';
            } else if (message.includes('talca') || message === '2') {
                location = 'Talca';
            } else if (message.includes('online') || message === '3') {
                location = 'Online';
            } else {
                await flowDynamic('Disculpa, no entendí tu respuesta. Por favor, elige entre 1 (Santiago de Chile), 2 (Talca) o 3 (Online) para la ubicación de la consulta.');
                return;
            }
            await flowDynamic(`Has elegido ${location} como lugar para tu cita.`);
            await state.update({ location, awaitingService: true });
        } catch (error) {
            console.error('Error al procesar la respuesta del usuario:', error);
            await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
        }
    })
    .addAnswer('¿Qué tipo de servicio deseas consultar?\n1. Cirugía de Mamas\n2. Cirugía de Cara\n3. Cirugía de Cuerpo\n4. Cirugía Post Operatoria', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            const message = ctx.body.trim().toLowerCase();
            let consultaService = '';
            switch (message) {
                case '1':
                case 'cirugía de mamas':
                    consultaService = 'Cirugía de Mamas';
                    await flowDynamic('Has elegido el servicio de Cirugía de Mamas.');
                    break;
                case '2':
                case 'cirugía de cara':
                    consultaService = 'Cirugía de Cara';
                    await flowDynamic('Has elegido el servicio de Cirugía de Cara.');
                    break;
                case '3':
                case 'cirugía de cuerpo':
                    consultaService = 'Cirugía de Cuerpo';
                    await flowDynamic('Has elegido el servicio de Cirugía de Cuerpo.');
                    break;
                case '4':
                case 'cirugía post operatoria':
                    consultaService = 'Cirugía Post Operatoria';
                    await flowDynamic('Has elegido el servicio de Cirugía Post Operatoria.');
                    break;
                default:
                    await flowDynamic('Disculpa, no entendí tu respuesta. Por favor, elige una opción válida para el servicio de consulta.');
                    return;
            }
            await state.update({ consultaService, awaitingFinalConfirmation: true });
        } catch (error) {
            console.error('Error al procesar la respuesta del usuario:', error);
            await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
        }
    })
    .addAction(async (ctx, { flowDynamic, state }) => {
        const userName = state.get('name') || 'Paciente';
        const selectedSlot = new Date(state.get('selectedSlot'));
        const location = state.get('location');
        const consultaService = state.get('consultaService');
   
        const confirmationDetails = `Por favor, confirma si la información está bien:\nNombre: ${userName}\nFecha y hora de cita: ${selectedSlot.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\nLugar: ${location}\nServicio: ${consultaService}\n\n¿Está todo correcto?`;
   
        await flowDynamic(confirmationDetails);
    })
    .addAnswer('Responde aquí con "1" SI o "2" NO', { capture: true })
    // Dentro de tu acción donde se realiza la confirmación y la solicitud POST
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            const userName = state.get('name') || 'Paciente';
            const selectedSlot = new Date(state.get('selectedSlot'));
            const location = state.get('location');
            const consultaService = state.get('consultaService');


            const message = ctx.body.trim().toLowerCase();


            if (message === '1' || message.includes('sí')) {
                // Mostrar confirmación final con los detalles
                const finalConfirmation = `Detalles de tu cita:\nNombre: ${userName}\nFecha y hora de cita: ${selectedSlot.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\nLugar: ${location}\nServicio: ${consultaService}`;
                await flowDynamic(finalConfirmation);


                // Mostrar mensaje de agradecimiento
                await flowDynamic(`Gracias por confirmar tu cita.\nEscribe "menu" para volver al menú principal.`);


                // Ejemplo de solicitud POST con Axios
                const url1 = 'https://hook.us1.make.com/pagvhxidr6v3iivpg5cdlgqipol6i58e';
                const data1 = {
                    nombre: userName,
                    tipo_consulta: 'Consulta médica', // Ajustar según tu necesidad
                    servicio: consultaService,
                    fecha: selectedSlot.toLocaleDateString('es-ES'),
                    hora: selectedSlot.toLocaleTimeString('es-ES'),
                    lugar: location
                };
                await axios.post(url1, data1);


                const url2 = 'https://hook.us1.make.com/ss9njaf792eulnvj7ukh4v81nfkcyse5';
                const data2 = {
                    name: userName,
                    startDate: selectedSlot.toISOString() // Formato ISO 8601 para la fecha y hora
                };
                await axios.post(url2, data2);


            } else if (message === '2' || message.includes('no')) {
                await flowDynamic('Entendido, dime qué quieres corregir.');
            } else {
                await flowDynamic('Por favor, elige entre 1 (Sí, está todo bien) o 2 (No, quiero corregir).');
            }
        } catch (error) {
            console.error('Error al procesar la respuesta del usuario:', error);
            await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
        }
    });

// Flujo para "Fecha específica"
const fechaEspecificaFlow = addKeyword(['fecha específica'])
    .addAnswer('Responde con la fecha específica en formato MMDD para agendar la cita.', { capture: true })
    .addAction(handleSpecificDateChoice)
    .addAnswer('Elige una opción (por ejemplo, 1, 2, 3) para confirmar el horario.', { capture: true })
    .addAction(handleSpecificDateSlotChoice)
    .addAnswer('Por favor, confirma la cita escribiendo sí o no.', { capture: true })
    .addAction(handleConfirmation);

async function handleInitialChoice(ctx, { flowDynamic, state }) {
    try {
        const message = ctx.body.trim().toLowerCase();
        if (message.includes('esta semana') || message === 'a') {
            const availableSlots = generateAvailableSlots();
            await state.update({ availableSlots, citaType: 'esta semana' });

            const { response, options } = generateWeeklyResponse(availableSlots);
            await state.update({ options });
            await flowDynamic(response);
        } else if (message.includes('fecha específica') || message === 'b') {
            await state.update({ citaType: 'fecha específica' });
            await flowDynamic('📆 Ok, genial! ¿Para qué fecha específica quieres la cita? Por favor, utiliza el formato **MMDD**.');
        } else {
            await flowDynamic('Disculpa, no entendí tu respuesta. ¿Quieres agendar una cita para esta semana o una fecha específica?');
        }
    } catch (error) {
        console.error('Error al procesar la respuesta del usuario:', error);
        await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    }
}

// Asegúrate de manejar adecuadamente las respuestas de las acciones
async function handleWeeklyChoice(ctx, { flowDynamic, state }) {
    try {
        const message = ctx.body.trim();
        const citaType = state.get('citaType');
        const options = state.get('options');

        if (citaType === 'esta semana' && options) {
            const selectedOption = parseInt(message);
            if (!isNaN(selectedOption) && selectedOption > 0 && selectedOption <= options.length) {
                const selectedSlot = options[selectedOption - 1].date;
                await state.update({ selectedSlot });

                const userName = state.get('name') || 'Paciente';
                await flowDynamic(`Entendido, agendaré la cita para ${new Date(selectedSlot).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. ¿Confirmas, ${userName}?`);
                await state.update({ awaitingConfirmation: true });
            } else {
                await flowDynamic('Disculpa, el número que seleccionaste no es válido. Por favor, elige una opción válida.');
            }
        }
    } catch (error) {
        console.error('Error al procesar la respuesta del usuario:', error);
        await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    }
}


async function handleSpecificDateChoice(ctx, { flowDynamic, state }) {
    try {
        const message = ctx.body.trim();

        if (!/^\d{4}$/.test(message)) {
            throw new Error('Formato de fecha no válido. Debe ser MMDD.');
        }

        const month = message.substring(0, 2);
        const day = message.substring(2, 4);

        const formattedDate = `2024-${month}-${day}`;
        const response = await axios.get('https://hook.us1.make.com/ii3qehn2pclx4c0pc83o7kl82pjmmlqc');

        const citasOcupadas = response.data;

        const ocupadasHoras = citasOcupadas
            .filter(cita => {
                const citaDate = new Date(cita.date);
                return !isNaN(citaDate.getTime()) && citaDate.toISOString().startsWith(formattedDate);
            })
            .map(cita => new Date(cita.date).getHours());

        const horariosDisponibles = [];
        for (let hora = 9; hora <= 19; hora++) {
            if (!ocupadasHoras.includes(hora)) {
                horariosDisponibles.push(hora);
            }
        }

        if (horariosDisponibles.length > 0) {
            const horariosDisponiblesTexto = horariosDisponibles
                .filter(hora => !(hora >= 12 && hora < 14))
                .map((hora, index) => `${index + 1}: 🕒 ${hora}:00`)
                .join('\n');

            await flowDynamic(`📆 Para el ${month}-${day} tienes libres los siguientes horarios:\n${horariosDisponiblesTexto}. ¿Te interesa alguno de esos?`);
            await state.update({ citaType: 'fecha específica', options: horariosDisponibles.map((hora, index) => ({ index: index + 1, hora })) });
        } else {
            await flowDynamic(`🕒 Lo siento, no hay horarios disponibles para el ${month}-${day}. ¿Quieres intentarlo para otra fecha?`);
        }
    } catch (error) {
        console.error('Error al procesar la respuesta del usuario:', error);
        await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    }
}

async function handleSpecificDateSlotChoice(ctx, { flowDynamic, state }) {
    try {
        const message = ctx.body.trim();
        const citaType = state.get('citaType');
        const options = state.get('options');

        if (citaType === 'fecha específica' && options) {
            const selectedOption = parseInt(message);
            if (!isNaN(selectedOption) && selectedOption > 0 && selectedOption <= options.length) {
                const selectedHora = options[selectedOption - 1].hora;
                const selectedSlot = `2024-${message.substring(0, 2)}-${message.substring(2, 4)}T${selectedHora}:00:00`;
                await state.update({ selectedSlot });

                const userName = state.get('name') || 'Paciente';
                await flowDynamic(`Entendido, agendaré la cita para el ${message.substring(2, 4)} de ${message.substring(0, 2)} a las ${selectedHora}:00. ¿Confirmas, ${userName}?`);
                await state.update({ awaitingConfirmation: true });
            } else {
                await flowDynamic('Disculpa, el número que seleccionaste no es válido. Por favor, elige una opción válida.');
            }
        }
    } catch (error) {
        console.error('Error al procesar la respuesta del usuario:', error);
        await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    }
}




async function handleConfirmation(ctx, { flowDynamic, state }) {
    try {
        const message = ctx.body.trim().toLowerCase();
        const awaitingConfirmation = state.get('awaitingConfirmation');
        const selectedSlot = state.get('selectedSlot');

        if (awaitingConfirmation && selectedSlot) {
            if (message.includes('sí') || message.includes('si') || message.includes('confirmo')) {
                const userName = state.get('name') || 'Paciente';

                await flowDynamic(`¡Excelente! Permíteme un momento para agendar tu cita, ${userName}... ⏳`);
                await state.update({ awaitingAdditionalInfo: true, consultaType: null, awaitingConfirmation: false });
            } else if (message.includes('no')) {
                await flowDynamic('Ok, dime cómo puedo ayudarte.');
                await state.update({ awaitingConfirmation: false, selectedSlot: null });
            } else {
                await flowDynamic('Disculpa, no entendí tu respuesta. Por favor, confirma la cita escribiendo sí o no.');
            }
        }
    } catch (error) {
        console.error('Error al procesar la respuesta del usuario:', error);
        await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    }
}



function generateSpecificDateResponse(availableSlots) {
    // Lógica para generar la respuesta de los horarios disponibles en una fecha específica
}






// Define dayMapping antes del flujo de conversación
const dayMapping: { [key: string]: number } = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6
};




function generateAvailableSlots() {
    const slots = [];
    const now = new Date();
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(now);
        date.setDate(now.getDate() + dayOffset);
        for (let hour = 9; hour <= 19; hour++) {
            if (hour !== 12 && hour !== 13) {
                const slot = new Date(date);
                slot.setHours(hour, 0, 0, 0);
                slots.push(slot);
            }
        }
    }
    return slots;
}

function generateWeeklyResponse(availableSlots) {
    let response = 'Genial, aquí están las citas disponibles para esta semana:\n\n';
    let currentDay = '';
    const options = [];
    
    for (let i = 0; i < availableSlots.length; i++) {
        const slotDateTime = new Date(availableSlots[i]);
        const slotTimeString = slotDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
        if (currentDay !== slotDateTime.toISOString().split('T')[0]) {
            currentDay = slotDateTime.toISOString().split('T')[0];
            response += `${getDayOfWeek(slotDateTime.getDay())} (${currentDay}):\n`;
        }
    
        response += `${i + 1}. ${slotTimeString}\n`;
        options.push({
            index: i + 1,
            date: slotDateTime.toISOString()
        });
    }
    
    return { response, options };
}
function getDayOfWeek(day) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
}




// Función para verificar disponibilidad
const checkAvailability = async (): Promise<string[]> => {
    try {
        const currentDate = new Date();
        const todayDayOfWeek = currentDate.getDay();
        const daysUntilNextMonday = (8 - todayDayOfWeek) % 7;
        const nextMondayDate = new Date(currentDate);
        nextMondayDate.setDate(currentDate.getDate() + daysUntilNextMonday);
        nextMondayDate.setHours(0, 0, 0, 0);  // Set to start of the day


        const nextFridayDate = new Date(nextMondayDate);
        nextFridayDate.setDate(nextMondayDate.getDate() + 4);
        nextFridayDate.setHours(23, 59, 59, 999);  // Set to end of the day


        const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR);
        if (!dataCalendarApi.ok) {
            throw new Error('Error fetching calendar data');
        }


        const events: any = await dataCalendarApi.json();
        if (!Array.isArray(events) || !events.every(event => 'date' in event && 'name' in event)) {
            throw new Error('Invalid calendar data format');
        }


        const eventsThisWeek = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= nextMondayDate && eventDate <= nextFridayDate;
        });


        const occupiedTimes = eventsThisWeek.map(event => {
            const date = new Date(event.date);
            return date.getTime();
        });


        const availableSlots: string[] = [];
        const timeSlots = ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];


        for (let day = 0; day < 5; day++) {
            const currentDay = new Date(nextMondayDate);
            currentDay.setDate(nextMondayDate.getDate() + day);


            for (const slot of timeSlots) {
                const slotDateTime = new Date(`${currentDay.toISOString().split('T')[0]}T${slot}:00`);
                if (!occupiedTimes.includes(slotDateTime.getTime()) && slotDateTime > currentDate) {
                    availableSlots.push(slotDateTime.toISOString());
                }
            }
        }


        return availableSlots;
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        return [];
    }
};






    const main = async () => {
        const adapterFlow = createFlow([
            welcomeFlow,
            serviciosFlow,
            agenteEnVivoFlow,
            agendaCitaFlow,
            estaSemanaFlow,
            fechaEspecificaFlow
        ]);
    
        const adapterProvider = createProvider(Provider);
        const adapterDB = new Database(); // Asegúrate de ajustar esto según la configuración de tu base de datos
    
        const { handleCtx, httpServer } = await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        });
    
        // Configuración del servidor HTTP para manejar solicitudes entrantes
        adapterProvider.server.post(
            '/v1/messages',
            handleCtx(async (bot, req, res) => {
                const { number, message, urlMedia } = req.body;
                await bot.sendMessage(number, message, { media: urlMedia ?? null });
                return res.end('Message sent successfully');
            })
        );
    
        // Iniciar el servidor HTTP
        const PORT = 3000; // Define el puerto que deseas utilizar
        httpServer(PORT);
    };
    
    main().catch(error => console.error('Error al iniciar el bot:', error));



function addAction(arg0: (ctx: any, { flowDynamic, state }: { flowDynamic: any; state: any; }) => Promise<void>) {
    throw new Error('Function not implemented.');
}

function addAnswer(arg0: string, arg1: { capture: boolean; }) {
    throw new Error('Function not implemented.');
}

export default agendaCitaFlow;