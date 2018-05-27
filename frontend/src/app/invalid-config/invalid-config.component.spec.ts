import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvalidConfigComponent } from './invalid-config.component';

describe('InvalidConfigComponent', () => {
  let component: InvalidConfigComponent;
  let fixture: ComponentFixture<InvalidConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvalidConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvalidConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
