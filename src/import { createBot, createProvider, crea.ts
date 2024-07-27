import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import fetch from 'node-fetch';
import { MAKE_GET_FROM_CALENDAR } from "./config/index";
import { MAKE_ADD_TO_CALENDAR } from "./config/index";
import { MAKE_ADD_TO_GOOGLE_SHEET } from "./config/index";
import axios from 'axios'; // Asegúrate de tener axios instalado para hacer solicitudes HTTP


const PORT = process.env.PORT ?? 3008;




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


const getDayOfWeek = (dayIndex: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayIndex];
};


const generateAvailableSlots = () => {
    const now = new Date();
    const slots: Date[] = [];
    const startTime = 9;
    const endTime = 19;
    const slotDuration = 45 * 60 * 1000; // 45 minutos en milisegundos


    const currentDay = now.getDay();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startTime, 0, 0);


    for (let day = currentDay; day <= 5; day++) { // De hoy hasta el viernes
        const daySlots: Date[] = [];
        for (let hour = startTime; hour < endTime; hour++) {
            const slot = new Date(startDate.getTime() + ((day - currentDay) * 24 * 60 * 60 * 1000) + ((hour - startTime) * slotDuration));
            if (slot >= now) { // Solo agregar slots en el futuro
                daySlots.push(slot);
            }
        }
        slots.push(...daySlots);
    }
    return slots;
};




// Definición de un tipo de estado básico para el bot
interface BotState {
    get(arg0: string): unknown;
    name?: string;
    selectedSlot?: Date;
    consultaService?: string;
    // Otros campos de estado que necesites
}


const state = {
    name: "Usuario Ejemplo",
    selectedSlot: new Date(),
    consultaService: "Consulta General",
    get: function(key: string) {
        // Implementación para recuperar valores según la clave
        return this[key];
    }
};




// Uso de 'state' en alguna parte de tu código
const userName = state.name || 'Paciente';
const selectedSlot = state.selectedSlot;
const consultaService = state.consultaService;


// Ejemplo de cómo actualizar 'state' en respuesta a una acción del usuario
async function actualizarEstado() {
    state.selectedSlot = new Date('2024-07-04T16:00:00Z');
    // Lógica para actualizar otros campos de 'state' según sea necesario
}
const location = state.get('location');




const agendaCitaFlow = addKeyword(['agenda cita', 'cita'])
    .addAnswer('📅 Vamos a programar tu cita.')
    .addAnswer([
        '¿Quieres agendar una cita para esta semana o una fecha específica?',
        '👉 Elige una opción:',
        '1. *Esta semana*',
        '2. *Fecha específica*'
    ].join('\n'), { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            const message = ctx.body.trim().toLowerCase();
   
            if (message.includes('esta semana') || message === '1') {
                const availableSlots = generateAvailableSlots();
                await state.update({ availableSlots });
   
                let response = 'Genial, aquí están las citas disponibles para esta semana:\n\n';
                let currentDay = '';
                const options = [];
   
                for (let i = 0; i < availableSlots.length; i++) {
                    const slotDateTime = new Date(availableSlots[i]);
                    const slotTimeString = `${slotDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
   
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
   
                await state.update({ citaType: 'esta semana', options });
                await flowDynamic(response); // Mostrar citas disponibles
                await flowDynamic('');
            } else if (message.includes('fecha específica') || message === '2') {
                await flowDynamic('Ok, ¿para qué fecha específica quieres la cita?');
                await state.update({ citaType: 'fecha específica' });
            } else {
                await flowDynamic('Disculpa, no entendí tu respuesta. ¿Quieres agendar una cita para esta semana o una fecha específica?');
            }
        } catch (error) {
            console.error('Error al procesar la respuesta del usuario:', error);
            await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
        }
    })
    .addAnswer('Responde con el número de la opción que prefieres (por ejemplo, 1, 2, 3) para agendar la cita.', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
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
    })
    .addAnswer('Por favor, confirma la cita escribiendo sí o no.', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
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
    })
   
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
   
   
export default agendaCitaFlow;












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


// Flujo para manejar la opción de servicios
const serviciosFlow = addKeyword<Provider, Database>(['servicios'])
    .addAnswer(
        'Ofrecemos una variedad de servicios para satisfacer tus necesidades:\n' +
        '1. *Cursos* 📘\n' +
        '2. *Charlas* 🎤\n' +
        '3. *Estrategias* 📈\n' +
        '¿En qué servicio estás interesado?'
    );


// Flujo para manejar la opción de agente en vivo
const agenteEnVivoFlow = addKeyword<Provider, Database>(['agente en vivo'])
    .addAnswer(
        'Un agente estará disponible pronto para atenderte en vivo. Gracias por tu paciencia.'
    );
const welcomeFlow = addKeyword<Provider, Database>(['hola', 'buenos días', 'buenas tardes'])
    .addAnswer('Hola, ¿cómo estás? Gracias por llegar al asistente virtual. Te ayudaré en lo que necesites, pero antes ¿me dirías tu nombre?', { capture: true })
    .addAction(async (ctx, { flowDynamic, state }) => {
        const userName = ctx.body; // Obtener el nombre del contexto actual
        await state.update({ name: userName }); // Guardar el nombre en el estado
        await flowDynamic(`Genial, ${userName}, un gusto hablar contigo. Por favor, escribe una opción para comenzar.`);
        await flowDynamic(
            [
                '👉 Elige una opción:',
                '1. *Agenda Cita* 📅',
                '2. *Servicios* 📋',
                '3. *Agente en Vivo* 🧑‍💼'
            ].join('\n')
        );
    });


const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, agendaCitaFlow, serviciosFlow, agenteEnVivoFlow]);


    const adapterProvider = createProvider(Provider);
    const adapterDB = new Database();


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
    httpServer(+PORT);
};


main();
