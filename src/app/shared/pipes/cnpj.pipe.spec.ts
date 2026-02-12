import { CnpjPipe } from './cnpj.pipe';

describe('CnpjPipe', () => {
  let pipe: CnpjPipe;

  beforeEach(() => {
    pipe = new CnpjPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format valid CNPJ', () => {
    expect(pipe.transform('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return original value for invalid length', () => {
    expect(pipe.transform('123')).toBe('123');
  });

  it('should format CNPJ with mask already applied', () => {
    expect(pipe.transform('12.345.678/0001-90')).toBe('12.345.678/0001-90');
  });
});
