import type { RefObject } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function SearchBox({ value, onChange, inputRef }: SearchBoxProps) {
  return (
    <label className="search-box">
      <svg
        className="search-box__icon"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10.5 10.5L14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        ref={inputRef}
        className="search-box__input"
        type="search"
        placeholder="Search..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="search-box__hint">/</span>
    </label>
  );
}
