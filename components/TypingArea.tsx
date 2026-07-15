export default function TypingArea({
  words,
  currentWordIndex,
  currentInput,
  mistyped,
}: {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  mistyped: boolean;
}) {
  return (
    <div className="w-full max-w-full rounded-2xl bg-white border border-black/10 p-4 sm:p-6 text-base sm:text-xl leading-relaxed font-mono tracking-wide select-none">
      <div className="flex flex-wrap gap-x-2 gap-y-1 break-words">
        {words.map((word, i) => {
          let className = "text-black/60";
          if (i < currentWordIndex) className = "text-black/35";
          if (i === currentWordIndex)
            className = mistyped ? "text-mistake" : "text-accent";

          return (
            <span key={i} className={className}>
              {i === currentWordIndex ? (
                <>
                  <span className={mistyped ? "text-mistake" : "text-accent"}>
                    {currentInput}
                  </span>
                  <span className="text-black/60">
                    {word.slice(currentInput.length)}
                  </span>
                </>
              ) : (
                word
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
