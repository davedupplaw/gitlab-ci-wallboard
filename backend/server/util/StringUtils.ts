export class StringUtils {
    public static parseCSV( csv: string ) {
        if ( csv === '' || !csv ) {
            return [];
        }
        return csv.split(',');
    }

    public static parseInteger(string: string, defaultValue: number) {
        return string ? parseInt(string, 10) : defaultValue;
    }

    public static parseWhitelist(whitelistString: string) {
        const arrayOfStuff = StringUtils.parseCSV(whitelistString);
        return arrayOfStuff.length === 0 ? null : arrayOfStuff;
    }

    public static tf(string: string, defaultValue: boolean) {
        return string ? string === 'true' : defaultValue;
    }

}
