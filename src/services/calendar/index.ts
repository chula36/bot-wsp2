import { MAKE_GET_FROM_CALENDAR, MAKE_ADD_TO_CALENDAR } from '../../config/index';
import fetch from 'node-fetch';

interface CalendarEvent {
  date: string;
  name: string;
}

const isCalendarEventArray = (data: any): data is CalendarEvent[] => {
  return Array.isArray(data) && data.every(event => 'date' in event && 'name' in event);
}

const checkAvailability = async (options: { type: string, startDate?: string, endDate?: string }): Promise<string[]> => {
  try {
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
      if (!isCalendarEventArray(events)) {
        throw new Error('Invalid calendar data format');
      }

      const eventsThisWeek = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= nextMondayDate && eventDate <= nextFridayDate;
      });

      const occupiedTimes = eventsThisWeek.map(event => {
        const date = new Date(event.date);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      });

      const availableSlots: string[] = [];
      const timeSlots = ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];

      // Preparar respuesta con mensaje inicial
      let response = 'Genial, quieres ver las citas para esta semana. ';
      response += 'Aguarda un momento que te mostraré las citas disponibles. ⏰\n\n';

      // Iterar sobre los días de la semana laboral (lunes a viernes)
      for (let day = 0; day < 5; day++) {
        const currentDay = new Date(nextMondayDate);
        currentDay.setDate(nextMondayDate.getDate() + day);

        // Mostrar el día de la semana y la fecha
        response += `${getDayOfWeek(currentDay.getDay())} (${currentDay.toISOString().split('T')[0]})\n`;

        // Mostrar los horarios disponibles para ese día
        for (const slot of timeSlots) {
          const slotDateTime = new Date(`${currentDay.toISOString().split('T')[0]}T${slot}:00`);
          const slotTimeString = `${slotDateTime.getHours()}:${slotDateTime.getMinutes().toString().padStart(2, '0')}`;
          if (!occupiedTimes.includes(slotTimeString) && slotDateTime > currentDate) {
            response += `⏰ ${slotDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
          }
        }
        response += '\n'; // Separador entre días
      }

      console.log(response); // Mostrar la respuesta en la consola (para propósitos de prueba)

      // Devolver los horarios disponibles en formato de lista de strings
      return availableSlots;
    } else if (options.type === 'specific_date') {
      const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR);
      if (!dataCalendarApi.ok) {
        throw new Error('Error fetching calendar data');
      }

      const events: any = await dataCalendarApi.json();
      if (!isCalendarEventArray(events)) {
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

const appToCalendar = async (payload: { name: string, startDate: string }) => {
  try {
    const dataApi = await fetch(MAKE_ADD_TO_CALENDAR, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    if (!dataApi.ok) {
      throw new Error('Error adding appointment');
    }
    return dataApi;
  } catch (err) {
    console.log(`Error al agregar cita: `, err);
    throw new Error('Error al agregar cita');
  }
};

// Función auxiliar para obtener el nombre del día de la semana
const getDayOfWeek = (day: number): string => {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return daysOfWeek[day];
};

export { checkAvailability, appToCalendar, getDayOfWeek };
