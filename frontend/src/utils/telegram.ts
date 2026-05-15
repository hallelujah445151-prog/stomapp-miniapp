declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        initData: string;
        themeParams: any;
        viewportHeight: number;
        isExpanded: boolean;
      };
    };
  }
}

export const telegramService = {
  isTelegramApp(): boolean {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  },

  init(): void {
    if (this.isTelegramApp()) {
      const tg = window.Telegram!.WebApp;
      tg.ready();
      tg.expand();
    }
  },

  getInitData(): string | null {
    if (this.isTelegramApp()) {
      return window.Telegram!.WebApp.initData;
    }
    return null;
  },

  close(): void {
    if (this.isTelegramApp()) {
      window.Telegram!.WebApp.close();
    }
  },

  sendData(data: any): void {
    if (this.isTelegramApp()) {
      window.Telegram!.WebApp.sendData(JSON.stringify(data));
    }
  },

  getThemeParams(): any {
    if (this.isTelegramApp()) {
      return window.Telegram!.WebApp.themeParams;
    }
    return null;
  }
};

export default telegramService;