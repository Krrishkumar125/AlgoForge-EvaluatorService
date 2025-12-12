export default function codeCreator(
  startCode: string,
  endCode: string,
  midCode: string,
): string {
  return `${startCode}

${midCode}

${endCode}`;
}
