import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';


@Component({
    selector: 'app-dropdown',
    imports: [],
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent {
  @Input() options: string[] = [];
  @Input() selectedOption: string | null = null;
  @Input() placeholder: string = '';
  @Input() ariaLabel: string = '';
  
  @Output() selectedOptionChange = new EventEmitter<string>();

  isOpen = false;

  selectOption(option: string): void {
    this.selectedOption = option;
    this.selectedOptionChange.emit(option);
    this.isOpen = false;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isOpen = false;
    }
  }

  trackByFn(index: number, item: string): string {
    return `${index}-${item}`;
  }
}
