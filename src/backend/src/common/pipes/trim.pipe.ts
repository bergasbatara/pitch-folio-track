import { Injectable, PipeTransform } from "@nestjs/common";

const trimValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(trimValue);
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      next[key] = trimValue(val);
    }
    return next;
  }
  return value;
};

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown) {
    return trimValue(value);
  }
}
