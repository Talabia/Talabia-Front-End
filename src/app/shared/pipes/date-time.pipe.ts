import { Pipe, PipeTransform, inject } from '@angular/core';
import moment from 'moment';
import 'moment/locale/ar';
import { LanguageService } from '../services/language.service';

const FORMAT_PRESETS: Record<string, string> = {
  date: 'DD MMM YYYY',
  time: 'hh:mm A',
  short: 'DD/MM/YYYY hh:mm A',
  medium: 'DD MMM YYYY, hh:mm A',
  long: 'dddd, DD MMMM YYYY, hh:mm A',
};

/**
 * Formats a datetime value in the viewer's local timezone, localized to the
 * current app language (Arabic/English). Accepts either a preset name
 * ('date' | 'time' | 'short' | 'medium' | 'long') or a raw moment format string.
 */
@Pipe({
  name: 'dateTime',
  standalone: true,
  pure: false,
})
export class DateTimePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(value?: string | Date | number | null, format: string = 'medium'): string {
    if (!value) {
      return '';
    }

    const parsed = moment(value);
    if (!parsed.isValid()) {
      return '';
    }

    parsed.locale(this.languageService.getCurrentLanguage());
    return parsed.format(FORMAT_PRESETS[format] ?? format);
  }
}
