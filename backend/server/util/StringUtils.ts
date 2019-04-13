export class StringUtils {
    public static parseCSV( csv: string ) {
        if ( csv === '' || !csv ) {
            return [];
        }
        return csv.split(',');
    }
}
