declare module 'zipcode-to-timezone' {
  interface ZipcodeToTimezone {
    lookup(zipCode: string): string | null;
  }
  const zipcodeToTimezone: ZipcodeToTimezone;
  export default zipcodeToTimezone;
  export function lookup(zipCode: string): string | null;
}
