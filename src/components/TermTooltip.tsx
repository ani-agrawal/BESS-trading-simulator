import { GLOSSARY } from '../engine/types';

interface Props {
  term: keyof typeof GLOSSARY;
  label?: string;
}

export default function TermTooltip({ term, label }: Props) {
  return (
    <span className="term-tooltip" title={GLOSSARY[term]}>
      {label ?? term}
    </span>
  );
}

