import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {Chart} from 'chart.js';

import {BehaviorSubject} from 'rxjs';
import CommitSummary from '../../../../shared/domain/CommitSummary';

@Component({
  selector: 'app-chart-card',
  templateUrl: './chart-card.component.html',
  styleUrls: ['./chart-card.component.scss']
})
export class ChartCardComponent implements OnInit {
  private chart: Chart;
  private _data = new BehaviorSubject<CommitSummary>(new CommitSummary());

  @Input()
  public set data(value: CommitSummary) {
    this._data.next(value);
  }

  public errorMessage: string;


  constructor(private rootElement: ElementRef) {
  }

  ngOnInit() {
    const ctx = this.rootElement.nativeElement.querySelector('#chart-card').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Loading'], //newData.getDataLabels(),
        datasets: [{
          label: '# of Votes',
          data: [0],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });

    this._data.subscribe(newData => {
      this.chart.data.labels = newData.getDataLabels();
      this.chart.data.datasets[0].data = newData.counts();
      this.chart.update();
    } );
  }
}
