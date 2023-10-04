import './polyfills';


import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import * as jsonlint from 'jsonlint'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/lib/codemirror';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/json-lint';
import 'codemirror/addon/mode/overlay.js';
import 'codemirror/mode/markdown/markdown';
// import 'codemirror/mode/markdown/gfm';


(window as any).jsonlint = jsonlint;


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
