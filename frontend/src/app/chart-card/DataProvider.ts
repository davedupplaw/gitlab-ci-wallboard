import {BehaviorSubject} from 'rxjs';

export default interface DataProvider extends BehaviorSubject<any> {
  getDataLabels(): string[];
}
