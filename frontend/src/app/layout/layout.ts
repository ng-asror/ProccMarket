import { Component } from '@angular/core';
import { Menubar, Navbar } from '../components';

@Component({
  selector: 'app-layout',
  imports: [Navbar, Menubar],
  template: `
    <main class="w-full h-dvh bg-[#030303] grid grid-cols-1 grid-rows-[auto_1fr_auto]">
      <app-navbar></app-navbar>

      <section class="w-full h-full bg-white pt-[10px] rounded-b-[30px] overflow-y-scroll">
        <ng-content select="[content]"></ng-content>
      </section>

      <app-menubar></app-menubar>
    </main>
  `,
})
export class Layout {}
