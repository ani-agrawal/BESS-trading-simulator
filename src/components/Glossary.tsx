import { useState } from 'react';
import { GLOSSARY } from '../engine/types';
import { BookOpen, X } from 'lucide-react';

export default function Glossary() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = Object.entries(GLOSSARY).filter(
    ([term, def]) =>
      term.toLowerCase().includes(search.toLowerCase()) ||
      def.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button className="btn btn-glossary" onClick={() => setIsOpen(true)} title="Trading Glossary">
        <BookOpen size={16} /> Learn
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal glossary-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Trading Glossary</h2>
              <button className="btn btn-icon" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              className="input glossary-search"
              placeholder="Search terms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="glossary-list">
              {filtered.map(([term, definition]) => (
                <div key={term} className="glossary-item">
                  <dt>{term}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
