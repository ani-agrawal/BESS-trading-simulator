import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  text: string;
}

export default function HelpIcon({ text }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span className="help-icon-wrapper">
      <button
        className="help-icon-btn"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label="Help"
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <div className="help-tooltip">
          <p>{text}</p>
        </div>
      )}
    </span>
  );
}
