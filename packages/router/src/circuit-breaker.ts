/**
 * Devre kesici (Bolum 11.1): ayni saglayici ardisik 2 hata ->
 * 5 dk "open" (atlanir). Basari her seyi sifirlar.
 */
export class CircuitBreaker {
  private fails = new Map<string, number>();
  private openUntil = new Map<string, number>();

  constructor(private threshold = 2, private cooldownMs = 5 * 60_000) {}

  isOpen(id: string): boolean {
    return (this.openUntil.get(id) ?? 0) > Date.now();
  }

  recordFailure(id: string): void {
    const n = (this.fails.get(id) ?? 0) + 1;
    this.fails.set(id, n);
    if (n >= this.threshold) {
      this.openUntil.set(id, Date.now() + this.cooldownMs);
      this.fails.set(id, 0);
    }
  }

  recordSuccess(id: string): void {
    this.fails.delete(id);
    this.openUntil.delete(id);
  }

  /** Panel icin durum goruntusu */
  snapshot(): { id: string; open: boolean; openUntil: number | null }[] {
    const ids = new Set([...this.fails.keys(), ...this.openUntil.keys()]);
    return [...ids].map((id) => ({
      id,
      open: this.isOpen(id),
      openUntil: this.openUntil.get(id) ?? null,
    }));
  }
}
