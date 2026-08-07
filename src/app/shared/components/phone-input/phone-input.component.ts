import { Component, Input, OnDestroy, OnInit, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import {
  AsYouType,
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../services/language.service';

export interface CountryOption {
  iso2: CountryCode;
  name: string;
  dialCode: string;
}

const NO_FLAG_ASSET = new Set<CountryCode>(['AC', 'TA']);

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, InputTextModule],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
})
export class PhoneInputComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() defaultCountry: CountryCode = 'SA';
  @Input() label?: string;
  @Input() lockCountry = false;

  private languageService = inject(LanguageService);
  private languageSub?: Subscription;

  countries: CountryOption[] = [];
  selectedCountry: CountryCode = 'SA';
  nationalNumber = '';
  disabled = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  ngOnInit(): void {
    this.selectedCountry = this.defaultCountry;
    this.buildCountryList();
    this.languageSub = this.languageService.languageChanged$.subscribe(() =>
      this.buildCountryList()
    );
  }

  ngOnDestroy(): void {
    this.languageSub?.unsubscribe();
  }

  private buildCountryList(): void {
    const lang = this.languageService.getCurrentLanguage();
    const displayNames = new Intl.DisplayNames([lang], { type: 'region' });
    this.countries = getCountries()
      // AC (Ascension Island) and TA (Tristan da Cunha) are numbering-plan-only
      // entries in libphonenumber-js with no corresponding flag-icons asset.
      .filter((iso2) => !NO_FLAG_ASSET.has(iso2))
      .map((iso2) => ({
        iso2,
        name: displayNames.of(iso2) ?? iso2,
        dialCode: `+${getCountryCallingCode(iso2)}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onCountryChange(country: CountryCode): void {
    this.selectedCountry = country;
    this.reformatNationalNumber(this.nationalNumber);
    this.emitValue();
  }

  onNumberInput(value: string): void {
    this.reformatNationalNumber(value);
    this.emitValue();
  }

  // AsYouType only groups digits once it recognizes a country's national dialing
  // pattern, which for many countries (e.g. Saudi Arabia) requires the national
  // trunk prefix to be present. Since this field holds the number *after* the
  // dial code already shown by the country selector, we format by prepending the
  // calling code, then strip it back off for display.
  private reformatNationalNumber(value: string): void {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      this.nationalNumber = '';
      return;
    }
    const callingCode = `+${getCountryCallingCode(this.selectedCountry)}`;
    const formatted = new AsYouType().input(`${callingCode}${digitsOnly}`);
    this.nationalNumber = formatted.startsWith(callingCode)
      ? formatted.slice(callingCode.length).trim()
      : formatted;
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  private emitValue(): void {
    if (!this.nationalNumber) {
      this.onChange(null);
      return;
    }
    const parsed = parsePhoneNumberFromString(this.nationalNumber, this.selectedCountry);
    this.onChange(parsed?.isValid() ? parsed.number : this.nationalNumber);
  }

  writeValue(value: string | null): void {
    if (!value) {
      this.nationalNumber = '';
      return;
    }
    const parsed = parsePhoneNumberFromString(value);
    if (parsed?.country) {
      this.selectedCountry = parsed.country;
      this.nationalNumber = parsed.formatNational();
    } else {
      this.nationalNumber = value;
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(): ValidationErrors | null {
    if (!this.nationalNumber) {
      return null;
    }
    return isValidPhoneNumber(this.nationalNumber, this.selectedCountry)
      ? null
      : { invalidPhone: true };
  }
}
