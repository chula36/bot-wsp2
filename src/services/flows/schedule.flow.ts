// En schedule.flow.ts
import { addKeyword, EVENTS } from "@builderbot/bot";
import { MAKE_GET_FROM_CALENDAR } from "../../config/index";
import fetch from 'node-fetch';

// Función auxiliar para obtener el nombre del día de la semana
const getDayOfWeek = (day: number): string => {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return daysOfWeek[day];
};

// Función para verificar disponibilidad
const checkAvailability = async (options: { type: string, startDate?: string, endDate?: string }): Promise<string[]> => {
  try {
    console.log('Verificando disponibilidad:', options);
    if (options.type === 'this_week') {
      const currentDate = new Date();
      const todayDayOfWeek = currentDate.getDay();

      const daysUntilNextMonday = (8 - todayDayOfWeek) % 7;
      const nextMondayDate = new Date(currentDate);
      nextMondayDate.setDate(currentDate.getDate() + daysUntilNextMonday);

      const nextFridayDate = new Date(nextMondayDate);
      nextFridayDate.setDate(nextMondayDate.getDate() + 4);

      const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR);
      if (!dataCalendarApi.ok) {
        throw new Error('Error fetching calendar data');
      }

      const events: any = await dataCalendarApi.json();
      console.log('Eventos obtenidos del calendario:', events);

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

      console.log('Horarios disponibles:', availableSlots);
      return availableSlots;
    } else if (options.type === 'specific_date') {
      const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR);
      if (!dataCalendarApi.ok) {
        throw new Error('Error fetching calendar data');
      }

      const events: any = await dataCalendarApi.json();
      if (!Array.isArray(events) || !events.every(event => 'date' in event && 'name' in event)) {
        throw new Error('Invalid calendar data format');
      }

      // Implementar lógica para obtener los horarios disponibles para la fecha específica
      return [];
    } else {
      throw new Error('Tipo de consulta no válido');
    }
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    return [];
  }
};

// Función para manejar el flujo de programación de citas
const handleScheduleFlow = async (message: string, flowDynamic: any) => {
  try {
    if (message.includes('esta semana') || message.includes('1')) {
      // Llamada a la función para verificar disponibilidad
      const availableSlots = await checkAvailability({ type: 'this_week' });

      // Construir respuesta con las citas disponibles
      let response = 'Genial, aquí están las citas disponibles para esta semana:\n\n';
      let currentDay = '';

      for (const slot of availableSlots) {
        const slotDateTime = new Date(slot);
        const slotTimeString = `${slotDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        if (currentDay !== slotDateTime.toISOString().split('T')[0]) {
          currentDay = slotDateTime.toISOString().split('T')[0];
          response += `${getDayOfWeek(slotDateTime.getDay())} (${currentDay}):\n`;
        }

        response += `⏰ ${slotTimeString}\n`;
      }

      await flowDynamic(response); // Mostrar citas disponibles
    } else if (message.includes('fecha específica') || message.includes('2')) {
      await flowDynamic('Ok, ¿para qué fecha específica quieres la cita?');
      // Aquí podrías implementar la lógica para manejar citas en fechas específicas
    } else {
      await flowDynamic('Disculpa, no entendí tu respuesta. ¿Quieres agendar una cita para esta semana o una fecha específica?');
    }
  } catch (error) {
    console.error("Error al procesar la respuesta del usuario:", error);
    await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
  }
};

const flowSchedule = addKeyword([EVENTS.ACTION])
  .addAnswer('📅 Vamos a programar tu cita.')
  .addAnswer([
    '¿Quieres agendar una cita para esta semana o una fecha específica?',
    '👉 Elige una opción:',
    '1. Esta semana',
    '2. Fecha específica'
  ].join('\n'), { capture: true })
  .addAction(async (ctx, { flowDynamic }) => {
    try {
      const message = ctx.body.toLocaleLowerCase().trim();
      console.log('Mensaje recibido del usuario:', message);
      await handleScheduleFlow(message, flowDynamic);
    } catch (error) {
      console.error("Error al procesar la respuesta del usuario:", error);
      await flowDynamic('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.');
    }
  });

export { flowSchedule };
