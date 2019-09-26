export class Logger {
    public log(...args: any[]) {
        console.log(new Date(), ...args);
    }
}
