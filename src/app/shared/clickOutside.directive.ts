import {
    Directive,
    ElementRef,
    EventEmitter,
    HostListener,
    Output,
  } from '@angular/core';
  import { fromEvent } from 'rxjs';
  import { first, take } from 'rxjs/operators';
  
  @Directive({
    selector: '[appClickOutside]',
  })
  export class ClickOutsideDirective {
    @Output() clickOutside = new EventEmitter();
  
    captured = false;
  
    constructor(private elRef: ElementRef) {}
  
    @HostListener('document:click', ['$event'])
    onClick(e) {
      if (!this.captured) {
        return;
      }
  
      if (!this.elRef.nativeElement.contains(e.target)) {
        this.clickOutside.emit(e);
      }
    }
  
    ngOnInit() {
      console.log(this.captured);
      fromEvent(document, 'click', { capture: true })
        .pipe(take(1))
        .subscribe(() => (this.captured = true));
    }
  }
  