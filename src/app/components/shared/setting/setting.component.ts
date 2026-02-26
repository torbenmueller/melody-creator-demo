import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Settings } from '../../../interfaces/settings';
import { DropdownComponent } from '../dropdown/dropdown.component';

@Component({
    selector: 'app-setting',
    imports: [DropdownComponent],
    templateUrl: './setting.component.html',
    styleUrl: './setting.component.css'
})
export class SettingComponent {
  @Input() settings!: Settings;
  @Input() setting!: keyof Settings;
  private _options: (string | number)[] = [];
  
  @Input() set options(value: (string | number)[]) {
    this._options = value;
    this.stringOptions = value.map(opt => opt.toString());
  }
  
  get options(): (string | number)[] {
    return this._options;
  }
  
  stringOptions: string[] = [];
  @Input() category!: string;
  @Input() icon!: string;
  
  @Output() selectedOption = new EventEmitter<string>();

  handleSelectedOptionChange(value: string | number) {
    // Convert to number if the setting is 'bar'
    if (this.setting === 'bar') {
      const numValue = Number(value);
      this.settings[this.setting] = numValue as any;
      this.selectedOption.emit(numValue.toString());
    } else {
      const strValue = value.toString();
      this.settings[this.setting] = strValue as any;
      this.selectedOption.emit(strValue);
    }
  }
}
