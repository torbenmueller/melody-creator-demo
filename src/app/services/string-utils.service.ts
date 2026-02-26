import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StringUtilsService {

  constructor() { }

  capitalizeFirstLetter(str?: string): string {
    if (!str) return '';
    const s = str.trim();
    if (!s) return '';
    return s[0].toUpperCase() + s.slice(1);
  }
}
