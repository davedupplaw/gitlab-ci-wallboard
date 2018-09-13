import {Component, Input, OnInit} from '@angular/core';
import {Status} from '../../../../shared/domain/Build';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  public statusString: string;
  @Input() public set status( value: Status ) {
    console.log( 'Status received: ', value );
    const str = Status[value];
    if ( str ) {
      this.statusString = str.toLowerCase();
    } else {
      this.statusString = 'unknown';
    }
  }

  constructor() {}

  ngOnInit() {
  }
}
