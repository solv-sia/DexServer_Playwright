class DateFormatter {
  private readonly date: Date;

  constructor() {
    this.date = new Date();
  }

  datetime(medialibrary = false): string {
    const d = this.date;
    const parts = {
      dia: String(d.getDate()).padStart(2, '0'),
      mes: String(d.getMonth() + 1).padStart(2, '0'),
      anio: d.getFullYear(),
      horas: String(d.getHours()).padStart(2, '0'),
      minutos: String(d.getMinutes()).padStart(2, '0'),
      segundos: String(d.getSeconds()).padStart(2, '0'),
    };

    if (medialibrary) {
      return `${parts.dia}-${parts.mes}-${parts.anio} ${parts.horas}.${parts.minutos}.${parts.segundos}`;
    }
    return `${parts.dia}/${parts.mes}/${parts.anio} ${parts.horas}:${parts.minutos}:${parts.segundos}`;
  }
}

export default new DateFormatter();
