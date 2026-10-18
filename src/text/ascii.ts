const ASCII_LAST_CODE = 0x7f;

export function containsNonAscii(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) > ASCII_LAST_CODE) {
      return true;
    }
  }
  return false;
}
