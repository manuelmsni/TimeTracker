class GoogleSheetsManager {
    static instance;
    loadedPromiseResolver;
    loaded;
  constructor() {
    this.loaded = new Promise((resolve) => {
        this.loadedPromiseResolver = resolve;
    });
    }
    static async getInstance(){
        if (GoogleSheetsManager.instance == null) {
            GoogleSheetsManager.instance = new GoogleSheetsManager();
            await GoogleSheetsManager.instance.init();
        }
        await CustomReader.instance.loaded;
        return GoogleSheetsManager.instance;
    }
    async init() {
        this.loadedPromiseResolver();
        console.log("GoogleSheetsManager initialized");
    }
}