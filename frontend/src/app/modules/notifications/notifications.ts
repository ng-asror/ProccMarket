import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-notifications',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class Notifications {}
