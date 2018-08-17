export default class StringUtils {
    public static parseCSV( csv: string ) {
        if( csv === "") {
            return [];
        }
        return csv.split(',');
    }
}
