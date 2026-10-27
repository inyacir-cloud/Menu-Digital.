function transferClabe(details: string): string | null {
  const lines = details.split(/\r?\n/);
  const labeled = lines.filter((line) => /\bclabe\b/i.test(line));
  const candidates = [...labeled, ...lines.filter((line) => !labeled.includes(line))]
    .flatMap((line) => line.match(/(?:\d[\d\s-]?){17}\d/g) ?? [])
    .map((value) => value.replace(/\D/g, ""))
    .filter((value) => value.length === 18);

  return candidates[0] ?? null;
}

export function formatClabe(clabe: string): string {
  return clabe.replace(/\D/g, "").replace(/(\d{3})(?=\d)/g, "$1 ");
}

export interface TransferData {
  bank: string | null;
  holder: string | null;
  account: string | null;
  clabe: string | null;
  other: string[];
}

export function parseTransferData(details: string): TransferData {
  const result: TransferData = { bank: null, holder: null, account: null, clabe: null, other: [] };

  for (const line of details.split(/\r?\n/)) {
    const cleaned = line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    if (!cleaned) continue;

    const labeledValue = cleaned.match(/^(banco|titular|beneficiario|clabe(?:\s+interbancaria)?|cuenta|n[uú]mero de cuenta)\s*[:\-]\s*(.*)$/i);
    if (labeledValue) {
      const [, label, value] = labeledValue;
      if (/^banco$/i.test(label)) result.bank = value || null;
      else if (/^(titular|beneficiario)$/i.test(label)) result.holder = value || null;
      else if (/^clabe/i.test(label)) result.clabe = transferClabe(value) ?? (value.trim() || null);
      else result.account = value || null;
      continue;
    }

    const clabe = transferClabe(cleaned);
    if (clabe && !result.clabe) {
      result.clabe = clabe;
      continue;
    }

    result.other.push(cleaned);
  }

  return result;
}

export function mercadoPagoLink(details: string): string | null {
  return details.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "") ?? null;
}
