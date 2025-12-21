export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

export function getEventStatus(startDateTime: string): 'upcoming' | 'happening' | 'past' {
  try {
    const startDate = new Date(startDateTime);
    const now = new Date();
    const ONE_HOUR = 60 * 60 * 1000;

    if (startDate > now) {
      return 'upcoming';
    } else if (startDate.getTime() + ONE_HOUR > now.getTime()) {
      return 'happening';
    } else {
      return 'past';
    }
  } catch (error) {
    return 'upcoming';
  }
}

export function getDaysUntilEvent(startDateTime: string): number {
  try {
    const startDate = new Date(startDateTime);
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    return 0;
  }
}

export function getEventCountdown(startDateTime: string): string {
  try {
    const startDate = new Date(startDateTime);
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();

    if (diffTime < 0) {
      return 'Iniziato';
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `Tra ${days} giorno${days > 1 ? 'i' : ''}`;
    } else if (hours > 0) {
      return `Tra ${hours} ora${hours > 1 ? 'e' : ''}`;
    } else if (minutes > 0) {
      return `Tra ${minutes} minuto${minutes > 1 ? 'i' : ''}`;
    } else {
      return 'Inizia a breve!';
    }
  } catch (error) {
    return 'Data non disponibile';
  }
}
