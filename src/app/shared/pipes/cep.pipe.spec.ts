import { CepPipe } from './cep.pipe';

describe('CepPipe', () => {
  let pipe: CepPipe;

  beforeEach(() => {
    pipe = new CepPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format valid CEP', () => {
    expect(pipe.transform('12345678')).toBe('12345-678');
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

  it('should format CEP with mask already applied', () => {
    expect(pipe.transform('12345-678')).toBe('12345-678');
  });
});
