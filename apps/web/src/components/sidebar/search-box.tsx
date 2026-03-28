import type { RefObject } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function SearchBox({
  value,
  onChange,
  inputRef,
}: SearchBoxProps) {
  return (
    <label className="search-box">
      <span className="search-box__hint">/</span>
      <input
        ref={inputRef}
        className="search-box__input"
        type="search"
        placeholder="Search requests"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
