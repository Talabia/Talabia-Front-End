import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PhoneInputComponent } from './phone-input.component';

describe('PhoneInputComponent validation', () => {
  function create(allowedFirstDigits?: string) {
    TestBed.configureTestingModule({
      imports: [PhoneInputComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const component = TestBed.createComponent(PhoneInputComponent).componentInstance;
    component.defaultCountry = 'SA';
    component.maxDigits = 9;
    component.allowedFirstDigits = allowedFirstDigits;
    component.ngOnInit();
    return component;
  }

  function type(component: PhoneInputComponent, value: string) {
    const input = document.createElement('input');
    input.value = value;
    component.onNumberInput(input);
    return input.value;
  }

  it('is valid for a 9-digit number starting with 5', () => {
    const c = create('5');
    type(c, '501234567');
    expect(c.validate()).toBeNull();
  });

  it('reports invalidPrefix for a number not starting with 5 (and keeps what was typed)', () => {
    const c = create('5');
    const shown = type(c, '0501234567');
    expect(shown.replace(/\D/g, '')).toBe('050123456'); // capped at 9 digits, not stripped
    expect(c.validate()).toEqual({ invalidPrefix: { allowed: '5' } });
  });

  it('reports invalidPrefix as soon as the first digit is wrong', () => {
    const c = create('5');
    type(c, '4');
    expect(c.validate()).toEqual({ invalidPrefix: { allowed: '5' } });
  });

  it('reports invalidPhone (not invalidPrefix) for an incomplete number starting with 5', () => {
    const c = create('5');
    type(c, '512');
    expect(c.validate()).toEqual({ invalidPhone: true });
  });

  it('accepts Arabic-Indic digits', () => {
    const c = create('5');
    type(c, '٥٠١٢٣٤٥٦٧');
    expect(c.validate()).toBeNull();
  });

  it('does not check the first digit when allowedFirstDigits is not set', () => {
    const c = create();
    type(c, '112345678');
    expect(c.validate()?.['invalidPrefix']).toBeUndefined();
  });
});
