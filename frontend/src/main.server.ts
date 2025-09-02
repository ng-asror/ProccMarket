import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';
import { register } from 'swiper/element/bundle';
register();
const bootstrap = () => bootstrapApplication(App, config);

export default bootstrap;
