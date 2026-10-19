import { orcamentos } from './orcamentos';
import { SourceCatalog } from './source';

export const SOURCES: SourceCatalog[] = [orcamentos];

export function findSource(name: string) {
  return SOURCES.find((source) => source.name === name);
}
