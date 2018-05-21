export default class StringUtils {
    public static parseCSV( csv: string ) {
        return csv.split(',');
    }
}
