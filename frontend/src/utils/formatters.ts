export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'in_progress':
      return '#ff9800';
    case 'completed':
      return '#4caf50';
    case 'cancelled':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'in_progress':
      return 'В работе';
    case 'completed':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    default:
      return status;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const formatDeadline = (dateString: string): { text: string; urgent: boolean } => {
  try {
    const deadline = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let text = formatDate(dateString);
    let urgent = false;
    
    if (diffDays < 0) {
      text = `Просрочено (${Math.abs(diffDays)} дн.)`;
      urgent = true;
    } else if (diffDays === 0) {
      text = 'Сегодня';
      urgent = true;
    } else if (diffDays === 1) {
      text = 'Завтра';
      urgent = true;
    } else if (diffDays <= 3) {
      text = `${diffDays} дн.`;
      urgent = true;
    }
    
    return { text, urgent };
  } catch {
    return { text: dateString, urgent: false };
  }
};