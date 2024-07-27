// Define una interfaz para el estado del bot
export interface BotStateStandAlone {
    availableSlots?: string[]; // Ejemplo de un arreglo de fechas disponibles
    citaType?: string; // Tipo de cita seleccionada ('esta semana', 'fecha específica', etc.)
    options?: { index: number, date: string }[]; // Opciones de citas disponibles con índice y fecha
    selectedSlot?: string; // Fecha y hora seleccionada para la cita
    awaitingConfirmation?: boolean; // Indica si estamos esperando la confirmación del usuario
    name?: string; // Nombre del usuario
    location?: string; // Ubicación de la cita
    consultaService?: string; // Servicio de consulta seleccionado
    awaitingFinalConfirmation?: boolean; // Indica si estamos esperando la confirmación final antes de agendar
}

// También puedes definir tipos específicos para cada parte del estado si es necesario
export type SlotOption = { index: number, date: string };

// También podrías tener constantes para los tipos de citas disponibles
export const CitaTypes = {
    EstaSemana: 'esta semana',
    FechaEspecifica: 'fecha específica',
    // Puedes agregar más tipos según tus necesidades
};
