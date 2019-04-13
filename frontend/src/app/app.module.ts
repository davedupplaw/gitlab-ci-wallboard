import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {AngularSvgIconModule} from 'angular-svg-icon';
import {AngularFontAwesomeModule} from 'angular-font-awesome';

import {AppComponent} from './app.component';
import {CardComponent} from './card/card.component';
import {BuildCardComponent} from './build-card/build-card.component';
import {LoaderComponent} from './loader/loader.component';
import {ErrorComponent} from './error/error.component';
import {InvalidConfigComponent} from './invalid-config/invalid-config.component';
import {LogoComponent} from './logo/logo.component';
import { ChartCardComponent } from './chart-card/chart-card.component';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import { StatusComponent } from './status/status.component';

@NgModule({
  declarations: [
    AppComponent,
    CardComponent,
    BuildCardComponent,
    LoaderComponent,
    ErrorComponent,
    InvalidConfigComponent,
    LogoComponent,
    ChartCardComponent,
    StatusComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AngularSvgIconModule,
    AngularFontAwesomeModule,
    SocketIoModule.forRoot({} as SocketIoConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
