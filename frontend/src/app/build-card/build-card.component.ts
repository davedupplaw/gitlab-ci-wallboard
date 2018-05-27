import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-build-card',
  templateUrl: './build-card.component.html',
  styleUrls: ['./build-card.component.scss']
})
export class BuildCardComponent implements OnInit {
  @Input() public build: any;
  @Input() public link: string;

  constructor() { }

  ngOnInit() {
  }

}
