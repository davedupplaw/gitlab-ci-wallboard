import {Component, Input, OnInit} from '@angular/core';
import CommitSummary from '../../../../shared/domain/CommitSummary';
import Project from '../../../../shared/domain/Project';

@Component({
  selector: 'app-build-card',
  templateUrl: './build-card.component.html',
  styleUrls: ['./build-card.component.scss']
})
export class BuildCardComponent implements OnInit {
  @Input() public project: Project;
  @Input() public link: string;

  constructor() {
  }

  ngOnInit() {
  }

  initials(name: string): string {
    if ( !name || name === '?' ) {
      return name;
    }

    const initials = name.match(/\b\w/g) || [];
    return ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
  }

  semantics(message: string): string {
    const labels = new CommitSummary().getDataLabels();

    for (const label of labels) {
      if (message.startsWith(label)) {
        return label;
      }
    }

    return '?';
  }

  removePreamble(message: string): string {
    return this.removeInitials(this.removeSemantics(message.trim()));
  }

  removeInitials(message: string): string {
    if (message.match( /^[A-Z:\/]{2,}/ ) ) {
      return message.substr(message.indexOf(' ')).trim();
    }

    return message;
  }

  removeSemantics(message: string): string {
    const labels = new CommitSummary().getDataLabels();

    for (const label of labels) {
      if (message.startsWith(label)) {
        return message.substr(message.indexOf(' ')).trim();
      }
    }

    return message;
  }
}
