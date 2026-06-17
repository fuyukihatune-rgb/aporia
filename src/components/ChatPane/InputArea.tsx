import { useRef, useEffect } from 'react';

interface Props {
  disabled: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function InputArea({ disabled, placeholder = '返答を入力…', onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const MAX_INPUT = 1000;

  const submit = () => {
    const val = (textareaRef.current?.value.trim() ?? '').slice(0, MAX_INPUT);
    if (!val || disabled) return;
    onSubmit(val);
    if (textareaRef.current) textareaRef.current.value = '';
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="input-bar">
      <textarea
        ref={textareaRef}
        className="input-textarea"
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        onInput={autoResize}
        onKeyDown={handleKey}
      />
      <button
        className="input-send"
        disabled={disabled}
        onClick={submit}
        aria-label="送信"
      >
        ↑
      </button>
    </div>
  );
}
