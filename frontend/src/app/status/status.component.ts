import {Component, Input} from '@angular/core';
import Stack from 'ts-data.stack';

class TimedStatus {
  constructor(private _status: any, private _time: number) {
  }

  get status(): any {
    return this._status;
  }

  get time(): number {
    return this._time;
  }
}

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent {
  @Input() set status(status: any) {
    if (status) {
      this._status.push(new TimedStatus(status, Date.now() + 5_000));
      this.updateStatusMessage();

      setTimeout(() => this.expire(), 5_000);
    }
  }

  get status() {
    return this._status;
  }

  public statusMessage: string = undefined;

  private _status: Stack<any> = new Stack<any>();

  constructor() {
    this._status.push(new TimedStatus({message: 'Ready'}, Number.MAX_SAFE_INTEGER));
    this.updateStatusMessage();
  }

  private expire() {
    while (!this._status.isEmpty() && this._status.peek().time < Date.now()) {
      this._status.pop();
      this.updateStatusMessage();
    }
  }

  private updateStatusMessage() {
    this.statusMessage = this._status.peek().status.message;
  }

  hasMessage() {
    return !this._status.isEmpty();
  }
}
